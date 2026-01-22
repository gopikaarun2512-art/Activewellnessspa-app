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
      next: { revalidate: 0 }, // Disable caching, works better with Vercel
    });

    if (!response.ok) {
      throw new Error(`n8n API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get Facebook leads for a specific date range from n8n workflow executions
   */
  async getLeads(startDate: Date, endDate: Date): Promise<FacebookLead[]> {
    try {
      // Debug: Log the date range being requested
      console.log('[FB Leads] Fetching leads for date range:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startDateAWST: startDate.toLocaleString('en-AU', { timeZone: 'Australia/Perth' }),
        endDateAWST: endDate.toLocaleString('en-AU', { timeZone: 'Australia/Perth' }),
      });

      // Check if n8n API is configured
      if (!this.n8nBaseUrl || !this.apiKey) {
        console.log('n8n API not configured for Facebook leads');
        return [];
      }

      // Known Facebook Lead workflow ID (1.Facebook Lead Capture depulication check)
      const facebookWorkflowId = '9gbmNOvmObqSIe8u';

      console.log(`Fetching executions for Facebook leads workflow ID: ${facebookWorkflowId}`);

      // Fetch executions using the standard executions endpoint with workflowId filter
      // n8n API max limit is 250
      const data = await this.fetchN8N(`/executions?workflowId=${facebookWorkflowId}&limit=250`);

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

      console.log(`[FB Leads] Extracted ${facebookLeads.length} Facebook leads`);

      // Log sample createdTime values for debugging
      if (facebookLeads.length > 0) {
        console.log('[FB Leads] Sample createdTime values:', facebookLeads.slice(0, 3).map(l => ({
          name: l.name,
          createdTime: l.createdTime,
          createdTimeParsed: new Date(l.createdTime).toISOString(),
        })));
      }

      // Filter to date range (client-side)
      const filteredLeads = facebookLeads.filter((lead) => {
        const leadDate = new Date(lead.createdTime);
        const isInRange = leadDate >= startDate && leadDate <= endDate;
        if (!isInRange && facebookLeads.length < 10) {
          // Log filtered out leads for debugging (only if small count)
          console.log(`[FB Leads] Lead filtered out:`, {
            name: lead.name,
            createdTime: lead.createdTime,
            leadDateISO: leadDate.toISOString(),
            startDateISO: startDate.toISOString(),
            endDateISO: endDate.toISOString(),
            afterStart: leadDate >= startDate,
            beforeEnd: leadDate <= endDate,
          });
        }
        return isInRange;
      });

      console.log(`[FB Leads] Filtered to ${filteredLeads.length} leads in date range (from ${facebookLeads.length} total)`);

      // Sort by created time (most recent first)
      return filteredLeads.sort((a, b) =>
        new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
      );
    } catch (error) {
      console.error('Error fetching Facebook leads:', error);
      return [];
    }
  }

  /**
   * Get today's Facebook leads from n8n workflow executions (legacy method for backward compatibility)
   */
  async getTodaysLeads(): Promise<FacebookLead[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return this.getLeads(today, endOfToday);
  }

  /**
   * Extract Facebook lead data from n8n execution
   * Priority: Look for "Normalize Lead Data" node first as it has the complete lead info
   * Also extracts journey tracking data (contact method, call outcome, GymMaster status)
   */
  private extractLeadFromExecution(execution: any): FacebookLead | null {
    try {
      const runData = execution.data?.resultData?.runData;
      if (!runData) return null;

      let leadData: any = {};
      let journeyData: any = {};

      // Priority 1: Look for "Normalize Lead Data (Phone + Attribution)" node
      // This node has the complete, normalized lead data
      const normalizeNodeName = 'Normalize Lead Data (Phone + Attribution)';
      if (runData[normalizeNodeName]) {
        const nodeRuns = runData[normalizeNodeName];
        if (nodeRuns?.[0]?.data?.main?.[0]?.[0]?.json) {
          const json = nodeRuns[0].data.main[0][0].json;

          leadData.id = json.lead_id || json.id;
          leadData.formId = json.form_id;
          leadData.formName = json.form_name;
          leadData.createdTime = json.created_time;
          leadData.name = json.full_name || `${json.firstName || ''} ${json.lastName || ''}`.trim();
          leadData.firstName = json.firstName;
          leadData.lastName = json.lastName;
          leadData.email = json.email;
          leadData.phone = json.phone_raw || json.phone_e164;
          leadData.adId = json.ad_id;
          leadData.adName = json.ad_name;
          leadData.source = json.ad_source;
          leadData.queueId = json.queue_id;
        }
      }

      // Priority 2: Look for "Parse GymMaster Response" node for booking status
      const gymMasterNodeName = 'Parse GymMaster Response';
      if (runData[gymMasterNodeName]) {
        const nodeRuns = runData[gymMasterNodeName];
        if (nodeRuns?.[0]?.data?.main?.[0]?.[0]?.json) {
          const json = nodeRuns[0].data.main[0][0].json;
          leadData.isMember = json.is_member;
          leadData.isBooked = json.is_booked;
          leadData.memberId = json.member_id;

          // Add to journey data
          journeyData.gymMasterChecked = true;
          journeyData.isBooked = json.is_booked === true;
          journeyData.isMember = json.is_member === true;
          journeyData.memberId = json.member_id;
        }
      }

      // Priority 3: Check "Get Lead Details" node for field_data (custom fields)
      const getLeadDetailsNodeName = 'Get Lead Details';
      if (runData[getLeadDetailsNodeName]) {
        const nodeRuns = runData[getLeadDetailsNodeName];
        if (nodeRuns?.[0]?.data?.main?.[0]?.[0]?.json) {
          const json = nodeRuns[0].data.main[0][0].json;
          if (json.field_data) {
            leadData.customFields = json.field_data;
          }
        }
      }

      // Priority 4: Check VAPI Status Handler for call outcomes and summary
      const vapiStatusNodeNames = [
        'VAPI Status Handler',
        'Process VAPI Status',
        'Handle Call Status',
        'Call Status Handler',
      ];
      for (const nodeName of vapiStatusNodeNames) {
        if (runData[nodeName]) {
          const json = this.getNodeJson(runData[nodeName]);
          if (json) {
            if (json.call_outcome) journeyData.callOutcome = json.call_outcome;
            if (json.call_summary || json.summary) journeyData.callSummary = json.call_summary || json.summary;
            if (json.booking_requested !== undefined) journeyData.bookingRequested = json.booking_requested;
            if (json.interest_level) journeyData.interestLevel = json.interest_level;
            if (json.vapi_call_id) journeyData.vapiCallId = json.vapi_call_id;
            if (json.call_duration) journeyData.callDuration = json.call_duration;
          }
        }
      }

      // Priority 5: Check for queue-related data (instant vs queued)
      const queueNodeNames = [
        'Add to Queue',
        'Queue Handler',
        'Process Queue',
        'Check Queue Status',
      ];
      for (const nodeName of queueNodeNames) {
        if (runData[nodeName]) {
          const json = this.getNodeJson(runData[nodeName]);
          if (json) {
            journeyData.contactMethod = 'queued';
            if (json.queued_at || json.queuedAt) journeyData.queuedAt = json.queued_at || json.queuedAt;
            if (json.status) journeyData.queueStatus = json.status;
          }
        }
      }

      // Priority 6: Check for callback data
      const callbackNodeNames = [
        'Schedule Callback',
        'Callback Handler',
        'Process Callback',
      ];
      for (const nodeName of callbackNodeNames) {
        if (runData[nodeName]) {
          const json = this.getNodeJson(runData[nodeName]);
          if (json) {
            journeyData.callbackRequested = true;
            if (json.scheduled_at || json.scheduledAt) journeyData.callbackScheduledAt = json.scheduled_at || json.scheduledAt;
            if (json.callback_reason || json.reason) journeyData.callbackReason = json.callback_reason || json.reason;
          }
        }
      }

      // Priority 7: Check VAPI Webhook nodes for call data
      const vapiWebhookNodeNames = [
        'Webhook',
        'VAPI Webhook',
        'Call Webhook',
      ];
      for (const nodeName of vapiWebhookNodeNames) {
        if (runData[nodeName]) {
          const json = this.getNodeJson(runData[nodeName]);
          if (json) {
            // Extract VAPI call data
            if (!journeyData.callSummary) {
              if (json.summary) journeyData.callSummary = json.summary;
              if (json.message?.summary) journeyData.callSummary = json.message.summary;
              if (json.message?.analysis?.summary) journeyData.callSummary = json.message.analysis.summary;
            }
            if (!journeyData.callOutcome && json.message?.analysis?.structuredData?.outcome) {
              journeyData.callOutcome = json.message.analysis.structuredData.outcome;
            }
            if (!journeyData.vapiCallId && (json.call?.id || json.message?.call?.id)) {
              journeyData.vapiCallId = json.call?.id || json.message?.call?.id;
            }
            if (!journeyData.callDuration && (json.call?.duration || json.message?.call?.duration)) {
              journeyData.callDuration = json.call?.duration || json.message?.call?.duration;
            }
            // Check if this was an instant call (has VAPI call data without queue)
            if (json.call || json.message?.call) {
              if (!journeyData.contactMethod) {
                journeyData.contactMethod = 'instant';
              }
              journeyData.contactedAt = json.call?.startedAt || json.message?.call?.startedAt || execution.startedAt;
            }
          }
        }
      }

      // Fallback: Search through all nodes if we don't have required data
      if (!leadData.id || !leadData.name) {
        Object.entries(runData).forEach(([nodeName, nodeRuns]: [string, any]) => {
          if (Array.isArray(nodeRuns)) {
            nodeRuns.forEach((run: any) => {
              if (run.data?.main?.[0]) {
                run.data.main[0].forEach((item: any) => {
                  if (item.json) {
                    const json = item.json;

                    // Only set if not already set (priority to specific nodes above)
                    if (!leadData.id && (json.lead_id || json.id)) {
                      leadData.id = json.lead_id || json.id;
                    }
                    if (!leadData.name) {
                      if (json.full_name) leadData.name = json.full_name;
                      else if (json.firstName || json.lastName) {
                        leadData.name = `${json.firstName || ''} ${json.lastName || ''}`.trim();
                      }
                    }
                    if (!leadData.email && json.email) leadData.email = json.email;
                    if (!leadData.phone && (json.phone_raw || json.phone_e164 || json.phone)) {
                      leadData.phone = json.phone_raw || json.phone_e164 || json.phone;
                    }
                    if (!leadData.formId && json.form_id) leadData.formId = json.form_id;
                    if (!leadData.formName && json.form_name) leadData.formName = json.form_name;
                    if (!leadData.createdTime && json.created_time) leadData.createdTime = json.created_time;
                    if (!leadData.adId && json.ad_id) leadData.adId = json.ad_id;
                    if (!leadData.adName && json.ad_name) leadData.adName = json.ad_name;
                    if (!leadData.source && json.ad_source) leadData.source = json.ad_source;
                    if (!leadData.customFields && json.field_data) leadData.customFields = json.field_data;

                    // Also extract journey data from fallback scan
                    if (!journeyData.callOutcome && (json.call_outcome || json.outcome)) {
                      journeyData.callOutcome = json.call_outcome || json.outcome;
                    }
                    if (!journeyData.callSummary && (json.call_summary || json.summary)) {
                      journeyData.callSummary = json.call_summary || json.summary;
                    }
                    if (json.callback_requested === true) {
                      journeyData.callbackRequested = true;
                    }
                    if (!journeyData.totalAttempts && json.attempts) {
                      journeyData.totalAttempts = json.attempts;
                    }
                  }
                });
              }
            });
          }
        });
      }

      // Validate required fields - use execution ID as fallback for lead ID
      if (!leadData.name) {
        return null;
      }

      // Determine status based on journey and GymMaster check
      let status: FacebookLead['status'] = 'new';
      if (journeyData.isBooked === true || leadData.isBooked === true) {
        status = 'booked';
      } else if (journeyData.callOutcome) {
        // Has been contacted
        status = 'contacted';
        if (journeyData.callOutcome === 'not_interested' || journeyData.callOutcome === 'wrong_number') {
          status = 'not_interested';
        }
      } else if (journeyData.isMember === true || leadData.isMember === true) {
        status = 'qualified'; // Member but not booked
      } else if (journeyData.contactMethod) {
        status = 'contacted';
      }

      // Build journey object only if we have journey data
      const journey = Object.keys(journeyData).length > 0 ? {
        contactMethod: journeyData.contactMethod,
        contactedAt: journeyData.contactedAt,
        queuedAt: journeyData.queuedAt,
        callbackRequested: journeyData.callbackRequested,
        callbackScheduledAt: journeyData.callbackScheduledAt,
        callbackReason: journeyData.callbackReason,
        callbackCompleted: journeyData.callbackCompleted,
        callOutcome: journeyData.callOutcome,
        callSummary: journeyData.callSummary,
        callDuration: journeyData.callDuration,
        vapiCallId: journeyData.vapiCallId,
        gymMasterChecked: journeyData.gymMasterChecked,
        isBooked: journeyData.isBooked,
        isMember: journeyData.isMember,
        memberId: journeyData.memberId,
        totalAttempts: journeyData.totalAttempts,
        lastAttemptAt: journeyData.contactedAt,
      } : undefined;

      // Build Facebook lead object
      const lead: FacebookLead = {
        id: String(leadData.id || execution.id),
        formId: leadData.formId || 'unknown',
        formName: leadData.formName,
        createdTime: leadData.createdTime || execution.startedAt,
        name: leadData.name || 'Unknown',
        email: leadData.email,
        phone: leadData.phone,
        adId: leadData.adId,
        adName: leadData.adName,
        status,
        source: this.normalizeSource(leadData.source),
        customFields: leadData.customFields,
        journey,
      };

      return lead;
    } catch (error) {
      console.error('Error extracting lead from execution:', error);
      return null;
    }
  }

  /**
   * Helper to extract JSON from a node's run data
   */
  private getNodeJson(nodeRuns: any): any | null {
    if (Array.isArray(nodeRuns) && nodeRuns[0]?.data?.main?.[0]?.[0]?.json) {
      return nodeRuns[0].data.main[0][0].json;
    }
    return null;
  }

  /**
   * Normalize source to one of the defined types
   */
  private normalizeSource(source?: string): FacebookLead['source'] {
    if (!source) return 'facebook_ad';

    const normalized = source.toLowerCase();
    if (normalized.includes('page')) return 'facebook_page';

    return 'facebook_ad';
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
