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

    return (data || []).map((call: any) => this.mapCall(call));
  }

  async getCall(id: string): Promise<VAPICall> {
    const data = await this.fetch(`/call/${id}`);
    return this.mapCall(data);
  }

  private mapCall(raw: any): VAPICall {
    // Debug: Log raw VAPI data to understand structure (only first call)
    if (raw.id && !this.debugLogged) {
      console.log('VAPI Raw Call Data Sample:', JSON.stringify({
        id: raw.id,
        // Summary is at TOP LEVEL (primary location)
        hasTopLevelSummary: !!raw.summary,
        topLevelSummaryPreview: raw.summary ? raw.summary.substring(0, 100) + '...' : null,
        // Also in analysis.summary
        hasAnalysisSummary: !!raw.analysis?.summary,
        analysisSummaryPreview: raw.analysis?.summary ? raw.analysis.summary.substring(0, 100) + '...' : null,
        // Legacy locations (for reference)
        hasArtifactSummary: !!raw.artifact?.summary,
      }, null, 2));
      this.debugLogged = true;
    }

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

    // Map status - IMPORTANT: Check for scheduled/queued FIRST before defaulting to completed
    let status: 'completed' | 'failed' | 'no-answer' | 'voicemail' | 'scheduled' | 'queued' = 'completed';
    const rawStatus = (raw.status || '').toLowerCase();

    // Check if this is a scheduled or queued call (not yet executed)
    if (rawStatus === 'scheduled') {
      status = 'scheduled';
    } else if (rawStatus === 'queued') {
      status = 'queued';
    } else if (raw.endedReason === 'customer-did-not-answer' || raw.endedReason === 'no-answer') {
      status = 'no-answer';
    } else if (raw.endedReason === 'voicemail') {
      status = 'voicemail';
    } else if (rawStatus === 'failed' || rawStatus === 'error') {
      status = 'failed';
    }

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

    // Extract summary from VAPI - check all possible locations
    // Based on actual VAPI API response: summary is at TOP LEVEL (raw.summary)
    // and also in raw.analysis.summary - NOT in artifact.summary
    let summary = '';

    // PRIMARY: Top-level summary (this is where VAPI actually stores it!)
    if (raw.summary) {
      summary = raw.summary;
    }
    // SECONDARY: analysis.summary (also contains the summary)
    else if (raw.analysis?.summary) {
      summary = raw.analysis.summary;
    }
    // FALLBACK: Check structuredOutputs for summary (some assistants output it here)
    else if (structuredOutputs.summary?.result) {
      summary = structuredOutputs.summary.result;
    }
    // Check for conversation_summary in structured outputs
    else if (structuredOutputs.conversation_summary?.result) {
      summary = structuredOutputs.conversation_summary.result;
    }
    // Last resort: Check analysis.structuredData for summary
    else if (raw.analysis?.structuredData?.summary) {
      summary = raw.analysis.structuredData.summary;
    }
    else if (raw.analysis?.structuredData?.conversation_summary) {
      summary = raw.analysis.structuredData.conversation_summary;
    }
    // Legacy fallback: artifact.summary (in case older API versions used this)
    else if (raw.artifact?.summary) {
      summary = raw.artifact.summary;
    }

    // Extract phone number - prioritize customer phone from assistantOverrides
    // For outbound calls, the actual customer phone is passed in assistantOverrides.variableValues.phone
    // raw.phoneNumber is VAPI's outbound phone line, NOT the customer's phone!
    let phoneNumber = '';

    // PRIORITY 1: Check assistantOverrides.variableValues.phone (actual customer phone for outbound calls)
    if (overrides.phone) {
      phoneNumber = overrides.phone;
    }
    // PRIORITY 2: Check customer.number (for inbound calls)
    else if (raw.customer?.number) {
      phoneNumber = raw.customer.number;
    }
    // PRIORITY 3: Check customer.phone
    else if (raw.customer?.phone) {
      phoneNumber = raw.customer.phone;
    }
    // FALLBACK: Only use raw.phoneNumber if nothing else available
    // Note: This is usually VAPI's phone line, not the customer's number
    else if (typeof raw.phoneNumber === 'string') {
      phoneNumber = raw.phoneNumber;
    } else if (raw.phoneNumber?.number) {
      phoneNumber = raw.phoneNumber.number;
    }

    return {
      id: raw.id,
      type,
      phoneNumber,
      duration,
      status,
      outcome,
      startedAt: raw.startedAt || raw.createdAt,
      endedAt: raw.endedAt,
      leadName,
      summary,
      scheduledAt: raw.scheduledAt, // For scheduled calls
    };
  }

  private debugLogged = false;

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

  /**
   * Get the count of calls for today (AWST: 12:00 AM to 11:59 PM)
   * Used for detecting new scheduled/completed calls
   * Resets at midnight AWST each day
   */
  async getTodaysCallCount(): Promise<{ count: number; latestCallId: string | null; latestCallTime: string | null }> {
    // Get current date in AWST
    const now = new Date();
    const awstFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Australia/Perth',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const awstDateStr = awstFormatter.format(now);
    const [year, month, day] = awstDateStr.split('-').map(Number);

    // AWST midnight (00:00) in UTC = 16:00 UTC previous day
    // For AWST date 2024-01-22, midnight is 2024-01-21 16:00 UTC
    const startOfDayAWSTinUTC = new Date(Date.UTC(year, month - 1, day - 1, 16, 0, 0, 0));

    const calls = await this.getCalls(startOfDayAWSTinUTC, now);

    return {
      count: calls.length,
      latestCallId: calls.length > 0 ? calls[0].id : null,
      latestCallTime: calls.length > 0 ? calls[0].startedAt : null,
    };
  }

  /**
   * Check if there are new calls since a given call ID
   */
  async hasNewCallsSince(lastKnownCallId: string | null, lastKnownCount: number): Promise<boolean> {
    const current = await this.getTodaysCallCount();

    // New calls detected if count increased or latest call ID changed
    if (current.count > lastKnownCount) {
      return true;
    }

    if (lastKnownCallId && current.latestCallId && current.latestCallId !== lastKnownCallId) {
      return true;
    }

    return false;
  }

  /**
   * Get scheduled calls from VAPI
   * These are calls that have been scheduled but not yet executed
   * Status can be: 'scheduled', 'queued'
   */
  async getScheduledCalls(): Promise<Array<{
    id: string;
    phone: string;
    leadName: string;
    scheduledAt: string;
    status: string;
    assistantId?: string;
  }>> {
    try {
      // Fetch recent and upcoming calls (scheduled calls may be in the future)
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // Look 7 days ahead

      const queryParams = new URLSearchParams();
      queryParams.append('limit', '100');

      const data = await this.fetch(`/call?${queryParams}`);

      console.log('[VAPI Client] Raw calls data for scheduled check:', {
        totalCalls: (data || []).length,
        sampleStatuses: (data || []).slice(0, 5).map((c: any) => ({
          id: c.id,
          status: c.status,
          scheduledAt: c.scheduledAt,
          createdAt: c.createdAt,
        })),
      });

      // Filter for scheduled/queued calls that haven't started yet
      const scheduledCalls = (data || []).filter((call: any) => {
        const status = (call.status || '').toLowerCase();
        // VAPI scheduled calls have status 'scheduled' or 'queued'
        return status === 'scheduled' || status === 'queued';
      });

      console.log(`[VAPI Client] Found ${scheduledCalls.length} scheduled calls`);

      return scheduledCalls.map((call: any) => {
        // Extract customer phone from various locations
        const overrides = call.assistantOverrides?.variableValues || {};
        let phone = '';
        if (overrides.phone) {
          phone = overrides.phone;
        } else if (call.customer?.number) {
          phone = call.customer.number;
        } else if (call.customer?.phone) {
          phone = call.customer.phone;
        } else if (typeof call.phoneNumber === 'string') {
          phone = call.phoneNumber;
        } else if (call.phoneNumber?.number) {
          phone = call.phoneNumber.number;
        }

        // Extract lead name
        let leadName = '';
        if (call.customer?.name) {
          leadName = call.customer.name;
        } else if (overrides.firstName || overrides.lastName) {
          leadName = `${overrides.firstName || ''} ${overrides.lastName || ''}`.trim();
        }

        return {
          id: call.id,
          phone,
          leadName: leadName || 'Scheduled Call',
          scheduledAt: call.scheduledAt || call.createdAt,
          status: call.status,
          assistantId: call.assistantId,
        };
      });
    } catch (error) {
      console.error('[VAPI Client] Error fetching scheduled calls:', error);
      return [];
    }
  }
}

export const vapiClient = new VAPIClient();
