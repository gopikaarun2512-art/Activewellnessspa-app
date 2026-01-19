import { FacebookLead } from '@/types/analytics';

const N8N_API_URL = process.env.N8N_API_URL || '';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

export class FacebookLeadsClient {
  private n8nBaseUrl: string;
  private apiKey: string;

  constructor() {
    this.n8nBaseUrl = N8N_API_URL;
    this.apiKey = N8N_API_KEY;
  }

  private async fetchN8N(endpoint: string, options: RequestInit = {}) {
    const url = `${this.n8nBaseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-N8N-API-KEY': this.apiKey,
        'Accept': 'application/json',
        ...options.headers,
      },
      cache: 'no-store', // Disable Next.js caching for large responses
    });

    if (!response.ok) {
      throw new Error(`n8n API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get today's Facebook leads from n8n workflow executions
   */
  async getTodaysLeads(): Promise<FacebookLead[]> {
    try {
      // Check if n8n API is configured
      if (!this.n8nBaseUrl || !this.apiKey) {
        console.log('n8n API not configured for Facebook leads');
        return [];
      }

      // Known Facebook Lead workflow ID
      const facebookWorkflowId = 'Gz4UxfzFByeh04nv';

      console.log(`Fetching executions for Facebook leads workflow ID: ${facebookWorkflowId}`);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch executions using the standard executions endpoint with workflowId filter
      const data = await this.fetchN8N(`/executions?workflowId=${facebookWorkflowId}&limit=100`);

      if (!data.data || !Array.isArray(data.data)) {
        console.log('No execution data returned');
        return [];
      }

      console.log(`Found ${data.data.length} executions for Facebook leads workflow`);

      // Fetch full execution data for each execution (includes runData)
      const fullExecutions = await Promise.all(
        data.data.map(async (exec: any) => {
          try {
            return await this.fetchN8N(`/executions/${exec.id}?includeData=true`);
          } catch (e) {
            console.error(`Failed to fetch execution ${exec.id}:`, e);
            return null;
          }
        })
      );

      // Extract lead data from executions
      const facebookLeads: FacebookLead[] = [];

      fullExecutions.forEach((execution: any) => {
        if (!execution) return;
        const lead = this.extractLeadFromExecution(execution);
        if (lead) {
          facebookLeads.push(lead);
        }
      });

      console.log(`Extracted ${facebookLeads.length} Facebook leads`);

      // Filter to today's leads only (client-side)
      const todaysLeads = facebookLeads.filter((lead) => {
        const leadDate = new Date(lead.createdTime);
        leadDate.setHours(0, 0, 0, 0);
        return leadDate.getTime() >= today.getTime();
      });

      console.log(`Filtered to ${todaysLeads.length} leads from today`);

      // Sort by created time (most recent first)
      return todaysLeads.sort((a, b) =>
        new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
      );
    } catch (error) {
      console.error('Error fetching Facebook leads:', error);
      return [];
    }
  }

  /**
   * Extract Facebook lead data from n8n execution
   */
  private extractLeadFromExecution(execution: any): FacebookLead | null {
    try {
      const runData = execution.data?.resultData?.runData;
      if (!runData) return null;

      let leadData: any = {};

      // Search through all nodes for Facebook lead data
      Object.values(runData).forEach((nodeRuns: any) => {
        if (Array.isArray(nodeRuns)) {
          nodeRuns.forEach((run: any) => {
            if (run.data?.main?.[0]) {
              run.data.main[0].forEach((item: any) => {
                if (item.json) {
                  const json = item.json;

                  // Extract standard Facebook lead fields
                  if (json.id) leadData.id = json.id;
                  if (json.lead_id) leadData.id = json.lead_id; // Normalize node uses lead_id
                  if (json.form_id) leadData.formId = json.form_id;
                  if (json.formId) leadData.formId = json.formId;
                  if (json.form_name) leadData.formName = json.form_name;
                  if (json.formName) leadData.formName = json.formName;
                  if (json.created_time) leadData.createdTime = json.created_time;
                  if (json.createdTime) leadData.createdTime = json.createdTime;

                  // Extract contact info
                  if (json.name) leadData.name = json.name;
                  if (json.full_name) leadData.name = json.full_name;
                  if (json.firstName && json.lastName) {
                    leadData.name = `${json.firstName} ${json.lastName}`.trim();
                  }
                  if (json.email) leadData.email = json.email;
                  if (json.phone) leadData.phone = json.phone;
                  if (json.phone_raw) leadData.phone = json.phone_raw; // Normalize node uses phone_raw
                  if (json.phone_e164) leadData.phone = json.phone_e164; // Also save E.164 format
                  if (json.phone_number) leadData.phone = json.phone_number;

                  // Extract ad info
                  if (json.ad_id) leadData.adId = json.ad_id;
                  if (json.adId) leadData.adId = json.adId;
                  if (json.ad_name) leadData.adName = json.ad_name;
                  if (json.adName) leadData.adName = json.adName;

                  // Extract status
                  if (json.status) leadData.status = json.status;
                  if (json.lead_status) leadData.status = json.lead_status;

                  // Extract source
                  if (json.source) leadData.source = json.source;
                  if (json.ad_source) leadData.source = json.ad_source; // Normalize node uses ad_source

                  // Collect custom fields
                  if (json.field_data || json.customFields) {
                    leadData.customFields = json.field_data || json.customFields;
                  }
                }
              });
            }
          });
        }
      });

      // Validate required fields
      if (!leadData.id || !leadData.name) {
        return null;
      }

      // Build Facebook lead object
      const lead: FacebookLead = {
        id: leadData.id || execution.id,
        formId: leadData.formId || 'unknown',
        formName: leadData.formName,
        createdTime: leadData.createdTime || execution.startedAt,
        name: leadData.name || 'Unknown',
        email: leadData.email,
        phone: leadData.phone,
        adId: leadData.adId,
        adName: leadData.adName,
        status: this.normalizeStatus(leadData.status),
        source: leadData.source || 'facebook_ad',
        customFields: leadData.customFields,
      };

      return lead;
    } catch (error) {
      console.error('Error extracting lead from execution:', error);
      return null;
    }
  }

  /**
   * Normalize status to one of the defined types
   */
  private normalizeStatus(status?: string): FacebookLead['status'] {
    if (!status) return 'new';

    const normalized = status.toLowerCase();
    if (normalized.includes('contact')) return 'contacted';
    if (normalized.includes('qualif')) return 'qualified';
    if (normalized.includes('book')) return 'booked';
    if (normalized.includes('not') || normalized.includes('reject')) return 'not_interested';

    return 'new';
  }
}

export const facebookLeadsClient = new FacebookLeadsClient();
