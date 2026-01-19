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
  } = {}): Promise<N8NExecution[]> {
    const queryParams = new URLSearchParams();

    if (params.workflowId) queryParams.append('workflowId', params.workflowId);
    if (params.status) queryParams.append('status', params.status);
    if (params.startedAfter) queryParams.append('startedAfter', params.startedAfter);
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const data: N8NExecutionsResponse = await this.fetch(`/executions?${queryParams}`);

    return data.data.map(this.mapExecution);
  }

  async getExecution(id: string): Promise<N8NExecution> {
    const data = await this.fetch(`/executions/${id}`);
    return this.mapExecution(data);
  }

  async listWorkflows(): Promise<any[]> {
    const data = await this.fetch('/workflows');
    return data.data || [];
  }

  private mapExecution(raw: any): N8NExecution {
    // Extract data from execution based on workflow type
    const executionData: any = {};

    // Try to extract phone, callType, outcome from execution data
    if (raw.data?.resultData?.runData) {
      const runData = raw.data.resultData.runData;

      // Look through nodes for relevant data
      Object.values(runData).forEach((nodeRuns: any) => {
        if (Array.isArray(nodeRuns)) {
          nodeRuns.forEach((run: any) => {
            if (run.data?.main?.[0]) {
              run.data.main[0].forEach((item: any) => {
                if (item.json) {
                  // Extract phone
                  if (item.json.phone) executionData.phone = item.json.phone;
                  if (item.json.phoneNumber) executionData.phone = item.json.phoneNumber;

                  // Extract names
                  if (item.json.firstName) executionData.firstName = item.json.firstName;
                  if (item.json.lastName) executionData.lastName = item.json.lastName;

                  // Extract email
                  if (item.json.email) executionData.email = item.json.email;

                  // Extract lead score
                  if (item.json.lead_score !== undefined) executionData.leadScore = item.json.lead_score;
                  if (item.json.leadScore !== undefined) executionData.leadScore = item.json.leadScore;

                  // Extract booking status
                  if (item.json.booked !== undefined) executionData.booked = item.json.booked;

                  // Extract outcome
                  if (item.json.outcome) executionData.outcome = item.json.outcome;
                  if (item.json.call_outcome) executionData.outcome = item.json.call_outcome;

                  // Extract link sent status
                  if (item.json.linkSent !== undefined) executionData.linkSent = item.json.linkSent;
                  if (item.json.link_sent !== undefined) executionData.linkSent = item.json.link_sent;
                  if (item.json.bookingLinkSent !== undefined) executionData.linkSent = item.json.bookingLinkSent;

                  // Extract call summary
                  if (item.json.callSummary) executionData.callSummary = item.json.callSummary;
                  if (item.json.call_summary) executionData.callSummary = item.json.call_summary;
                  if (item.json.summary) executionData.callSummary = item.json.summary;
                  if (item.json.conversation_summary) executionData.callSummary = item.json.conversation_summary;

                  // Try to determine call type from workflow name or data
                  if (item.json.callType) executionData.callType = item.json.callType;
                  if (item.json.type) executionData.callType = item.json.type;
                }
              });
            }
          });
        }
      });
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

  // Get today's executions for specific workflows
  async getTodaysCallData(): Promise<N8NExecution[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const executions = await this.listExecutions({
      status: 'success',
      startedAfter: today.toISOString(),
      limit: 1000,
    });

    // Filter for call-related workflows
    return executions.filter(exec =>
      exec.workflowName?.toLowerCase().includes('call') ||
      exec.workflowName?.toLowerCase().includes('vapi') ||
      exec.workflowName?.toLowerCase().includes('phone') ||
      exec.workflowName?.toLowerCase().includes('validation')
    );
  }

  // Get queued/running executions (calls in progress or waiting)
  async getQueuedCalls(): Promise<N8NExecution[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const executions = await this.listExecutions({
      status: 'running',
      startedAfter: today.toISOString(),
      limit: 500,
    });

    // Filter for call-related workflows that are currently running or queued
    return executions.filter(exec =>
      exec.workflowName?.toLowerCase().includes('call') ||
      exec.workflowName?.toLowerCase().includes('vapi') ||
      exec.workflowName?.toLowerCase().includes('phone') ||
      exec.workflowName?.toLowerCase().includes('validation')
    );
  }
}

export const n8nClient = new N8NClient();
