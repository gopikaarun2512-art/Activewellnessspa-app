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
    // Determine call type (from VAPI Status Handler: inboundPhoneCall vs outboundPhoneCall)
    let type: 'inbound' | 'outbound' = 'outbound';
    if (raw.type === 'inbound' || raw.type === 'inboundPhoneCall') {
      type = 'inbound';
    }

    // Map endedReason to normalized outcome (matching VAPI Status Handler workflow)
    // Workflow normalizes: customer-busy -> busy, customer-ended-call -> no_answer,
    // voicemail -> voicemail, no-answer -> no_answer, customer-did-not-answer -> no_answer
    const endedReasonMap: Record<string, string> = {
      'customer-busy': 'busy',
      'customer-ended-call': 'no_answer',
      'assistant-ended-call': 'no_answer',
      'voicemail': 'voicemail',
      'no-answer': 'no_answer',
      'customer-did-not-answer': 'no_answer',
      'assistant-did-not-answer': 'no_answer',
    };

    // Map status
    let status: 'completed' | 'failed' | 'no-answer' | 'voicemail' = 'completed';
    if (raw.endedReason === 'customer-did-not-answer' || raw.endedReason === 'no-answer') status = 'no-answer';
    else if (raw.endedReason === 'voicemail') status = 'voicemail';
    else if (raw.status === 'failed' || raw.status === 'error') status = 'failed';

    // Extract outcome - check structuredOutputs first (where VAPI Status Handler looks)
    // Then check analysis.structuredData, then use endedReason mapping
    let outcome: string = status;

    // Check artifact.structuredOutputs (primary source from VAPI end-of-call-report)
    const structuredOutputs = raw.artifact?.structuredOutputs || {};

    // The workflow uses specific UUIDs for structured outputs, but we can also check generic 'result' or 'outcome'
    const outcomeFromStructured =
      structuredOutputs['1e5fcbc0-665c-40cb-8c4d-7f0b3a4f4f40']?.result || // specific UUID from workflow
      structuredOutputs.outcome?.result ||
      structuredOutputs.result;

    if (outcomeFromStructured) {
      outcome = outcomeFromStructured;
    } else if (raw.analysis?.structuredData?.outcome) {
      outcome = raw.analysis.structuredData.outcome;
    } else if (raw.endedReason && endedReasonMap[raw.endedReason]) {
      outcome = endedReasonMap[raw.endedReason];
    }

    // Extract booking_requested flag from structured outputs
    const bookingRequested =
      structuredOutputs['48ace4eb-93a3-464e-a28e-9b1ff410aa64']?.result || // specific UUID from workflow
      structuredOutputs.booking_requested?.result ||
      false;

    // If booking was requested, set outcome to booking_link_sent
    if (bookingRequested === true) {
      outcome = 'booking_link_sent';
    }

    // Calculate duration
    const duration = raw.endedAt && raw.startedAt
      ? Math.floor((new Date(raw.endedAt).getTime() - new Date(raw.startedAt).getTime()) / 1000)
      : 0;

    // Extract lead name from customer data or assistantOverrides
    let leadName = '';
    const overrides = raw.assistantOverrides?.variableValues || {};

    if (raw.customer?.name) {
      leadName = raw.customer.name;
    } else if (overrides.firstName || overrides.lastName) {
      leadName = `${overrides.firstName || ''} ${overrides.lastName || ''}`.trim();
    } else if (raw.customer?.firstName || raw.customer?.lastName) {
      leadName = `${raw.customer.firstName || ''} ${raw.customer.lastName || ''}`.trim();
    }

    // Extract summary from artifact - check multiple possible locations
    // VAPI stores summaries in different places depending on configuration
    const summary =
      raw.artifact?.summary ||                      // Primary: artifact.summary
      raw.artifact?.analysis?.summary ||            // Fallback: artifact.analysis.summary
      raw.analysis?.summary ||                      // Fallback: analysis.summary
      raw.summary ||                                // Fallback: top-level summary
      '';

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
      summary,
    };
  }

  // Get calls for a specific date range
  async getCalls(startDate: Date, endDate: Date): Promise<VAPICall[]> {
    return this.listCalls({
      createdAtGt: startDate.toISOString(),
      createdAtLt: endDate.toISOString(),
      limit: 1000,
    });
  }

  // Get today's calls (legacy method for backward compatibility)
  async getTodaysCalls(): Promise<VAPICall[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return this.getCalls(today, endOfToday);
  }
}

export const vapiClient = new VAPIClient();
