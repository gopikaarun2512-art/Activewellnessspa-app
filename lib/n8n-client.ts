import { N8NExecution } from '@/types/analytics';

const N8N_API_URL = process.env.N8N_API_URL || '';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

interface N8NExecutionsResponse {
  data: any[];
  nextCursor?: string;
}

export class N8NClient {
  private baseUrl: string;
  private apiKey: string;
  private workflowCache: Map<string, string> = new Map(); // workflowId -> workflowName

  constructor() {
    this.baseUrl = N8N_API_URL;
    this.apiKey = N8N_API_KEY;
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
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

  async listExecutions(params: {
    workflowId?: string;
    status?: 'success' | 'error' | 'running';
    startedAfter?: string;
    limit?: number;
    includeData?: boolean;
  } = {}): Promise<N8NExecution[]> {
    const queryParams = new URLSearchParams();

    if (params.workflowId) queryParams.append('workflowId', params.workflowId);
    if (params.status) queryParams.append('status', params.status);
    // Note: startedAfter is not supported by n8n API, we'll filter client-side
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const data: N8NExecutionsResponse = await this.fetch(`/executions?${queryParams}`);

    // If includeData is requested, fetch full execution data for each execution
    let executions: N8NExecution[];
    if (params.includeData) {
      const fullExecutions = await Promise.all(
        data.data.map(async (exec: any) => {
          try {
            const fullExec = await this.fetch(`/executions/${exec.id}?includeData=true`);
            return this.mapExecution(fullExec);
          } catch (e) {
            console.error(`Failed to fetch full execution ${exec.id}:`, e);
            return this.mapExecution(exec);
          }
        })
      );
      executions = fullExecutions;
    } else {
      executions = data.data.map((exec: any) => this.mapExecution(exec));
    }

    // Filter by startedAfter client-side if provided
    if (params.startedAfter) {
      const filterDate = new Date(params.startedAfter);
      executions = executions.filter(exec => new Date(exec.startedAt) >= filterDate);
    }

    return executions;
  }

  async getExecution(id: string): Promise<N8NExecution> {
    const data = await this.fetch(`/executions/${id}`);
    return this.mapExecution(data);
  }

  async listWorkflows(): Promise<any[]> {
    const data = await this.fetch('/workflows');
    return data.data || [];
  }

  async getWorkflow(id: string): Promise<{ id: string; name: string }> {
    const data = await this.fetch(`/workflows/${id}`);
    return { id: data.id, name: data.name };
  }

  private async getWorkflowName(workflowId: string): Promise<string> {
    // Check cache first
    if (this.workflowCache.has(workflowId)) {
      return this.workflowCache.get(workflowId)!;
    }

    // Fetch individual workflow to get name
    try {
      const workflow = await this.getWorkflow(workflowId);
      this.workflowCache.set(workflowId, workflow.name);
      return workflow.name;
    } catch (e) {
      console.error(`Failed to fetch workflow ${workflowId}:`, e);
      return '';
    }
  }

  private mapExecution(raw: any): N8NExecution {
    // Extract data from execution based on workflow type
    const executionData: any = {};

    // Try to extract phone, callType, outcome from execution data
    if (raw.data?.resultData?.runData) {
      const runData = raw.data.resultData.runData;

      // Priority extraction from known workflow nodes (like Facebook leads client)
      // These nodes have the most reliable, normalized data

      // 1. Check "VAPI Status Handler" or similar call status nodes for call outcomes
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
            if (json.call_outcome) executionData.outcome = json.call_outcome;
            if (json.call_summary) executionData.callSummary = json.call_summary;
            if (json.summary) executionData.callSummary = json.summary;
            if (json.booking_requested !== undefined) executionData.bookingRequested = json.booking_requested;
            if (json.interest_level) executionData.interestLevel = json.interest_level;
          }
        }
      }

      // 2. Check "Normalize Lead Data" node for lead info (same as Facebook leads)
      const normalizeNodeNames = [
        'Normalize Lead Data (Phone + Attribution)',
        'Normalize Lead Data',
        'Process Lead Data',
      ];
      for (const nodeName of normalizeNodeNames) {
        if (runData[nodeName]) {
          const json = this.getNodeJson(runData[nodeName]);
          if (json) {
            if (json.phone_raw || json.phone_e164 || json.phone) {
              executionData.phone = json.phone_raw || json.phone_e164 || json.phone;
            }
            if (json.firstName) executionData.firstName = json.firstName;
            if (json.lastName) executionData.lastName = json.lastName;
            if (json.full_name) executionData.fullName = json.full_name;
            if (json.email) executionData.email = json.email;
            if (json.lead_score !== undefined) executionData.leadScore = json.lead_score;
          }
        }
      }

      // 3. Check "Parse GymMaster Response" for booking status
      const gymMasterNodeNames = [
        'Parse GymMaster Response',
        'GymMaster Response',
        'Check GymMaster',
      ];
      for (const nodeName of gymMasterNodeNames) {
        if (runData[nodeName]) {
          const json = this.getNodeJson(runData[nodeName]);
          if (json) {
            if (json.is_booked !== undefined) executionData.isBooked = json.is_booked;
            if (json.is_member !== undefined) executionData.isMember = json.is_member;
            if (json.member_id) executionData.memberId = json.member_id;
          }
        }
      }

      // 4. Check for VAPI webhook data nodes (contains call summary and structured outputs)
      const vapiWebhookNodeNames = [
        'Webhook',
        'VAPI Webhook',
        'Call Webhook',
      ];
      for (const nodeName of vapiWebhookNodeNames) {
        if (runData[nodeName] && !executionData.callSummary) {
          const json = this.getNodeJson(runData[nodeName]);
          if (json) {
            // VAPI sends summary at top level or in message.summary
            if (json.summary) executionData.callSummary = json.summary;
            if (json.message?.summary) executionData.callSummary = json.message.summary;
            if (json.message?.analysis?.summary) executionData.callSummary = json.message.analysis.summary;
            // Also check for call outcome in webhook data
            if (json.message?.analysis?.structuredData?.outcome) {
              executionData.outcome = json.message.analysis.structuredData.outcome;
            }
          }
        }
      }

      // Fallback: Look through all nodes if we don't have required data
      if (!executionData.phone || !executionData.callSummary) {
        Object.entries(runData).forEach(([nodeName, nodeRuns]: [string, any]) => {
          if (Array.isArray(nodeRuns)) {
            nodeRuns.forEach((run: any) => {
              if (run.data?.main?.[0]) {
                run.data.main[0].forEach((item: any) => {
                  if (item.json) {
                    // Only set if not already set (priority to specific nodes above)
                    // Extract phone
                    if (!executionData.phone) {
                      if (item.json.phone) executionData.phone = item.json.phone;
                      if (item.json.phoneNumber) executionData.phone = item.json.phoneNumber;
                      if (item.json.phone_raw) executionData.phone = item.json.phone_raw;
                      if (item.json.phone_e164) executionData.phone = item.json.phone_e164;
                    }

                    // Extract names
                    if (!executionData.firstName && item.json.firstName) executionData.firstName = item.json.firstName;
                    if (!executionData.lastName && item.json.lastName) executionData.lastName = item.json.lastName;
                    if (!executionData.fullName && item.json.full_name) executionData.fullName = item.json.full_name;

                    // Extract email
                    if (!executionData.email && item.json.email) executionData.email = item.json.email;

                    // Extract lead score
                    if (executionData.leadScore === undefined) {
                      if (item.json.lead_score !== undefined) executionData.leadScore = item.json.lead_score;
                      if (item.json.leadScore !== undefined) executionData.leadScore = item.json.leadScore;
                    }

                    // Extract booking status - check all possible fields from workflows
                    if (executionData.isBooked === undefined) {
                      if (item.json.booked !== undefined) executionData.booked = item.json.booked;
                      if (item.json.booking_requested !== undefined) executionData.bookingRequested = item.json.booking_requested;
                      if (item.json.is_booked !== undefined) executionData.isBooked = item.json.is_booked;
                    }

                    // Extract outcome - prioritize call_outcome from VAPI Status Handler
                    if (!executionData.outcome) {
                      if (item.json.outcome) executionData.outcome = item.json.outcome;
                      if (item.json.call_outcome) executionData.outcome = item.json.call_outcome;
                    }

                    // Extract interest level from VAPI structured outputs
                    if (!executionData.interestLevel && item.json.interest_level) executionData.interestLevel = item.json.interest_level;
                    if (!executionData.serviceInterest && item.json.service_interest) executionData.serviceInterest = item.json.service_interest;

                    // Extract link sent status
                    if (executionData.linkSent === undefined) {
                      if (item.json.linkSent !== undefined) executionData.linkSent = item.json.linkSent;
                      if (item.json.link_sent !== undefined) executionData.linkSent = item.json.link_sent;
                      if (item.json.bookingLinkSent !== undefined) executionData.linkSent = item.json.bookingLinkSent;
                    }

                    // Extract call summary
                    if (!executionData.callSummary) {
                      if (item.json.callSummary) executionData.callSummary = item.json.callSummary;
                      if (item.json.call_summary) executionData.callSummary = item.json.call_summary;
                      if (item.json.summary) executionData.callSummary = item.json.summary;
                      if (item.json.conversation_summary) executionData.callSummary = item.json.conversation_summary;
                    }

                    // Try to determine call type from workflow name or data
                    if (!executionData.callType) {
                      if (item.json.callType) executionData.callType = item.json.callType;
                      if (item.json.type) executionData.callType = item.json.type;
                    }
                  }
                });
              }
            });
          }
        });
      }
    }

    return {
      id: raw.id,
      workflowId: raw.workflowId,
      workflowName: raw.workflowName || '',
      status: raw.status || 'success',
      startedAt: raw.startedAt,
      finishedAt: raw.finishedAt,
      data: executionData,
    };
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

  // Get executions for a specific date range
  async getCallData(startDate: Date, endDate: Date): Promise<N8NExecution[]> {
    // n8n API limit is 250 max
    // Use includeData: true to fetch full execution data (like Facebook leads client)
    const executions = await this.listExecutions({
      status: 'success',
      startedAfter: startDate.toISOString(),
      limit: 250,
      includeData: true, // Fetch full execution data for proper extraction
    });

    // Filter by end date client-side (n8n API doesn't have startedBefore param)
    const filtered = executions.filter(exec => {
      const execDate = new Date(exec.startedAt);
      return execDate >= startDate && execDate <= endDate;
    });

    return filtered;
  }

  // Get today's executions for specific workflows (legacy method for backward compatibility)
  async getTodaysCallData(): Promise<N8NExecution[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return this.getCallData(today, endOfToday);
  }

  // Get queued/running executions (calls in progress or waiting)
  async getQueuedCalls(): Promise<N8NExecution[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // n8n API limit is 250 max
    const executions = await this.listExecutions({
      status: 'running',
      startedAfter: today.toISOString(),
      limit: 250,
    });

    // Return all running executions for now
    return executions;
  }
}

export const n8nClient = new N8NClient();
