import { QueuedCall } from '@/types/analytics';

const N8N_WEBHOOK_BASE = process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE || '';
const QUEUE_WEBHOOK_PATH = process.env.NEXT_PUBLIC_QUEUE_WEBHOOK_PATH || '/call-queue-api';

// Google Sheets API fallback (optional)
const GOOGLE_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY || '';
const QUEUE_SPREADSHEET_ID = process.env.QUEUE_SPREADSHEET_ID || '';
const QUEUE_SHEET_NAME = process.env.QUEUE_SHEET_NAME || 'queue';

interface QueueSheetRow {
  queue_id: string;
  contact_id?: string;
  opportunity_id?: string;
  phone_e164: string;
  email?: string;
  firstName: string;
  lastName: string;
  earliest_call_at?: string;
  execution_time?: string;
  scheduled_call_time?: string;
  cron_expression?: string;
  priority?: 'high' | 'medium' | 'low';
  'inbound/outbound'?: string;
  source?: string;
  campaign_type?: string;
  status: string;
  attempts?: number;
  created_at: string;
  updated_at?: string;
  execution_batch?: string;
  batch_position?: number;
  bypass_business_hours?: boolean;
  callback_reason?: string;
  vapi_call_id?: string;
  vapi_call_type?: string;
  call_outcome?: string;
  call_duration?: number;
  transcript?: string;
  summary?: string;
  sentiment?: string;
  interest_level?: string;
  booking_requested?: boolean;
  'booking _link_sent'?: boolean;
  is_member?: boolean;
  is_booked?: boolean;
  upcoming_booking_count?: number;
}

export class QueueClient {
  private webhookUrl: string;
  private useGoogleSheetsFallback: boolean;

  constructor() {
    this.webhookUrl = `${N8N_WEBHOOK_BASE}${QUEUE_WEBHOOK_PATH}`;
    this.useGoogleSheetsFallback = Boolean(GOOGLE_SHEETS_API_KEY && QUEUE_SPREADSHEET_ID);
  }

  /**
   * Fetch queue data from n8n webhook (primary source)
   * The webhook returns pre-transformed data matching QueuedCall structure
   */
  async getQueueFromWebhook(): Promise<QueuedCall[]> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 0 }, // Disable caching, works better with Vercel
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle both array and wrapped response
      const items = Array.isArray(data) ? data : data.data || [];

      // The webhook already returns transformed data, just ensure types are correct
      return items.map((item: any) => ({
        id: item.id || '',
        phone: String(item.phone || ''),
        leadName: item.leadName || 'Unknown',
        type: item.type === 'inbound' ? 'inbound' : 'outbound',
        queuedAt: item.queuedAt || new Date().toISOString(),
        estimatedCallTime: item.estimatedCallTime || undefined,
        priority: item.priority || 'medium',
        workflowName: item.workflowName || undefined,
        // Extended fields
        status: item.status,
        email: item.email,
        contactId: item.contactId,
        opportunityId: item.opportunityId,
        attempts: item.attempts,
        vapiCallId: item.vapiCallId,
        callOutcome: item.callOutcome,
        batchPosition: item.batchPosition,
      } as QueuedCall & Record<string, any>));
    } catch (error) {
      console.error('Error fetching queue from webhook:', error);
      throw error;
    }
  }

  /**
   * Fetch queue data from Google Sheets API (fallback)
   */
  async getQueueFromGoogleSheets(): Promise<QueuedCall[]> {
    if (!this.useGoogleSheetsFallback) {
      console.log('Google Sheets fallback not configured');
      return [];
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${QUEUE_SPREADSHEET_ID}/values/${QUEUE_SHEET_NAME}?key=${GOOGLE_SHEETS_API_KEY}`;

      const response = await fetch(url, {
        next: { revalidate: 0 }, // Disable caching, works better with Vercel
      });

      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.statusText}`);
      }

      const data = await response.json();
      const rows = this.parseSheetValues(data.values || []);

      return this.mapSheetRowsToQueuedCalls(rows);
    } catch (error) {
      console.error('Error fetching queue from Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Get queue data with n8n webhook as primary, Google Sheets as fallback
   */
  async getQueue(): Promise<QueuedCall[]> {
    try {
      // Try n8n webhook first
      return await this.getQueueFromWebhook();
    } catch (webhookError) {
      console.warn('Webhook failed, trying Google Sheets fallback:', webhookError);

      if (this.useGoogleSheetsFallback) {
        try {
          return await this.getQueueFromGoogleSheets();
        } catch (sheetsError) {
          console.error('Google Sheets fallback also failed:', sheetsError);
        }
      }

      // Return empty array if both fail
      return [];
    }
  }

  /**
   * Get only queued (pending) calls
   * The n8n webhook already filters out completed calls, so we return all results
   * Only filter out if status explicitly indicates completion
   */
  async getQueuedCalls(): Promise<QueuedCall[]> {
    const allCalls = await this.getQueue();

    // Statuses that indicate the call is complete and should not be shown
    const completedStatuses = ['completed', 'failed', 'cancelled', 'done', 'called', 'no_answer', 'voicemail', 'not_interested'];

    return allCalls.filter(call => {
      const status = ((call as any).status || '').toLowerCase().trim();
      // Include if status is not in the completed list
      return !completedStatuses.includes(status);
    });
  }

  /**
   * Parse Google Sheets API response (array of arrays) into objects
   */
  private parseSheetValues(values: string[][]): QueueSheetRow[] {
    if (values.length < 2) return []; // Need at least header + 1 data row

    const headers = values[0];
    const dataRows = values.slice(1);

    return dataRows.map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj as QueueSheetRow;
    });
  }

  /**
   * Map Google Sheet rows to QueuedCall type
   */
  private mapSheetRowsToQueuedCalls(rows: QueueSheetRow[]): QueuedCall[] {
    return rows
      .filter(row => row.queue_id && row.phone_e164) // Filter out empty rows
      .map(row => {
        // Determine call type
        let callType: 'inbound' | 'outbound' = 'outbound';
        const typeField = row['inbound/outbound']?.toLowerCase();
        if (typeField === 'inbound') {
          callType = 'inbound';
        }

        // Build lead name
        const leadName = [row.firstName, row.lastName]
          .filter(Boolean)
          .join(' ')
          .trim() || 'Unknown';

        // Determine priority
        let priority: 'high' | 'medium' | 'low' = 'medium';
        if (row.priority) {
          priority = row.priority;
        }

        // Parse queued time
        const queuedAt = row.scheduled_call_time ||
                         row.execution_time ||
                         row.created_at ||
                         new Date().toISOString();

        // Build workflow/source name
        const workflowName = [row.source, row.campaign_type]
          .filter(Boolean)
          .join(', ') || undefined;

        return {
          id: row.queue_id,
          phone: row.phone_e164,
          leadName,
          type: callType,
          queuedAt,
          estimatedCallTime: row.scheduled_call_time,
          priority,
          workflowName,
          // Extended fields for internal use
          status: row.status,
          email: row.email,
          contactId: row.contact_id,
          opportunityId: row.opportunity_id,
          attempts: row.attempts,
          vapiCallId: row.vapi_call_id,
          callOutcome: row.call_outcome,
          batchPosition: row.batch_position,
        } as QueuedCall & {
          status?: string;
          email?: string;
          contactId?: string;
          opportunityId?: string;
          attempts?: number;
          vapiCallId?: string;
          callOutcome?: string;
          batchPosition?: number;
        };
      });
  }
}

export const queueClient = new QueueClient();
