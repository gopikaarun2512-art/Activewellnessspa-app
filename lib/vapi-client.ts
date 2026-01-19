import { VAPICall } from '@/types/analytics';

const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY || '';

export class VAPIClient {
  private apiKey: string;
  private baseUrl = 'https://api.vapi.ai';

  constructor() {
    this.apiKey = VAPI_PRIVATE_KEY;
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`VAPI API error: ${response.statusText}`);
    }

    return response.json();
  }

  async listCalls(params: {
    createdAtGt?: string;
    createdAtLt?: string;
    limit?: number;
  } = {}): Promise<VAPICall[]> {
    const queryParams = new URLSearchParams();

    if (params.createdAtGt) queryParams.append('createdAtGt', params.createdAtGt);
    if (params.createdAtLt) queryParams.append('createdAtLt', params.createdAtLt);
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const data = await this.fetch(`/call?${queryParams}`);

    return (data || []).map(this.mapCall);
  }

  async getCall(id: string): Promise<VAPICall> {
    const data = await this.fetch(`/call/${id}`);
    return this.mapCall(data);
  }

  private mapCall(raw: any): VAPICall {
    // Determine call type
    let type: 'inbound' | 'outbound' = 'outbound';
    if (raw.type === 'inbound' || raw.type === 'inboundPhoneCall') {
      type = 'inbound';
    }

    // Map status
    let status: 'completed' | 'failed' | 'no-answer' | 'voicemail' = 'completed';
    if (raw.endedReason === 'customer-did-not-answer') status = 'no-answer';
    else if (raw.endedReason === 'voicemail') status = 'voicemail';
    else if (raw.status === 'failed' || raw.status === 'error') status = 'failed';

    // Extract outcome from analysis or messages
    let outcome = status;
    if (raw.analysis?.structuredData?.outcome) {
      outcome = raw.analysis.structuredData.outcome;
    }

    // Calculate duration
    const duration = raw.endedAt && raw.startedAt
      ? Math.floor((new Date(raw.endedAt).getTime() - new Date(raw.startedAt).getTime()) / 1000)
      : 0;

    // Extract lead name from customer data
    let leadName = '';
    if (raw.customer?.name) {
      leadName = raw.customer.name;
    } else if (raw.customer?.firstName || raw.customer?.lastName) {
      leadName = `${raw.customer.firstName || ''} ${raw.customer.lastName || ''}`.trim();
    }

    return {
      id: raw.id,
      type,
      phoneNumber: raw.customer?.number || raw.phoneNumber || '',
      duration,
      status,
      outcome,
      startedAt: raw.startedAt || raw.createdAt,
      endedAt: raw.endedAt,
      leadName,
    };
  }

  // Get today's calls
  async getTodaysCalls(): Promise<VAPICall[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.listCalls({
      createdAtGt: today.toISOString(),
      createdAtLt: tomorrow.toISOString(),
      limit: 1000,
    });
  }
}

export const vapiClient = new VAPIClient();
