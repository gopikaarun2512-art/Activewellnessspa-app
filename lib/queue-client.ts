import { QueuedCall, ScheduledCallback, CompletedCall } from '@/types/analytics';

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
  booking_link_sent?: boolean;
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
      // Add cache-busting timestamp to prevent any caching
      const cacheBuster = `?_t=${Date.now()}`;
      const response = await fetch(`${this.webhookUrl}${cacheBuster}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store', // Disable fetch cache
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.statusText}`);
      }

      const data = await response.json();

      // Debug: Log raw webhook response including scheduled time fields
      console.log('[Queue Client] Raw webhook response:', {
        itemCount: Array.isArray(data) ? data.length : (data.data?.length || 0),
        sampleData: (Array.isArray(data) ? data : data.data || []).slice(0, 3).map((item: any) => ({
          name: item.leadName || item.firstName,
          status: item.status,
          callOutcome: item.callOutcome || item.call_outcome,
          priority: item.priority,
          scheduledFields: {
            estimatedCallTime: item.estimatedCallTime,
            scheduled_call_time: item.scheduled_call_time,
            execution_time: item.execution_time,
            earliest_call_at: item.earliest_call_at,
          },
        })),
      });

      // Handle both array and wrapped response
      const items = Array.isArray(data) ? data : data.data || [];

      // Normalize priority value to valid options
      const normalizePriority = (p: string | undefined): 'high' | 'medium' | 'low' => {
        if (!p) return 'medium';
        const lower = p.toLowerCase();
        if (lower === 'high' || lower === 'instant' || lower === 'urgent') return 'high';
        if (lower === 'low') return 'low';
        return 'medium';
      };

      // The webhook already returns transformed data, just ensure types are correct
      const mappedItems = items.map((item: any) => ({
        id: item.id || item.queue_id || '',
        phone: String(item.phone || item.phone_e164 || ''),
        leadName: item.leadName || [item.firstName, item.lastName].filter(Boolean).join(' ') || 'Unknown',
        type: item.type === 'inbound' || item['inbound/outbound'] === 'inbound' ? 'inbound' : 'outbound',
        queuedAt: item.queuedAt || item.created_at || new Date().toISOString(),
        // Map scheduled time from multiple possible field names
        estimatedCallTime: item.estimatedCallTime || item.scheduled_call_time || item.execution_time || item.earliest_call_at || undefined,
        priority: normalizePriority(item.priority),
        workflowName: item.workflowName || item.source || undefined,
        // Extended fields
        status: item.status,
        email: item.email,
        contactId: item.contactId || item.contact_id,
        opportunityId: item.opportunityId || item.opportunity_id,
        attempts: item.attempts,
        vapiCallId: item.vapiCallId || item.vapi_call_id,
        callOutcome: item.callOutcome || item.call_outcome,
        batchPosition: item.batchPosition || item.batch_position,
        callbackReason: item.callbackReason || item.callback_reason,
      } as QueuedCall & Record<string, any>));

      // Deduplicate by phone number (keep the most recent entry)
      const seenPhones = new Map<string, QueuedCall>();
      for (const item of mappedItems) {
        const existingItem = seenPhones.get(item.phone);
        if (!existingItem || new Date(item.queuedAt) > new Date(existingItem.queuedAt)) {
          seenPhones.set(item.phone, item);
        }
      }

      const dedupedItems = Array.from(seenPhones.values());
      console.log(`[Queue Client] Deduped ${mappedItems.length} -> ${dedupedItems.length} items`);

      return dedupedItems;
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
   * Filter out completed calls and stale entries
   *
   * IMPORTANT: If the sheet has old entries that are no longer active,
   * we filter out items older than 24 hours
   */
  async getQueuedCalls(): Promise<QueuedCall[]> {
    const allCalls = await this.getQueue();

    // Statuses that indicate the call is complete and should not be shown
    const completedStatuses = [
      'completed', 'failed', 'cancelled', 'done', 'called',
      'no_answer', 'voicemail', 'not_interested', 'ended',
      'success', 'error', 'busy', 'wrong_number', 'callback_completed'
    ];

    // Statuses containing these words indicate the call was scheduled with VAPI
    // but if it's older than 24 hours, it's likely completed/stale
    const scheduledWithVapiStatuses = ['scheduled_with_vapi', 'vapi'];

    // Filter for stale entries - items older than 24 hours are likely stale/completed
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const filtered = allCalls.filter(call => {
      const status = ((call as any).status || '').toLowerCase().trim();
      const callOutcome = ((call as any).callOutcome || '').toLowerCase().trim();

      // Check if this entry is stale (older than 24 hours)
      const queuedAt = new Date(call.queuedAt);
      const isStale = queuedAt < twentyFourHoursAgo;

      // If stale (older than 24 hours), filter it out regardless of status
      // These are old entries that should have been processed already
      if (isStale) {
        console.log(`[Queue Filter] Removing stale entry: ${call.leadName} (queued ${call.queuedAt}, status: ${status})`);
        return false;
      }

      // If status indicates completion, exclude it
      if (completedStatuses.some(cs => status.includes(cs))) {
        return false;
      }

      // If has a call outcome indicating completion, filter out
      if (callOutcome && completedStatuses.some(cs => callOutcome.includes(cs))) {
        return false;
      }

      // Include the call if it passed all filters
      return true;
    });

    console.log(`[Queue Filter] Filtered ${allCalls.length} -> ${filtered.length} calls`);
    return filtered;
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
          callbackReason: row.callback_reason,
        } as QueuedCall;
      });
  }

  /**
   * Get scheduled callbacks - calls where callback was requested
   * These have status 'scheduled_with_vapi' or callback_reason set
   */
  async getScheduledCallbacks(): Promise<ScheduledCallback[]> {
    const allCalls = await this.getQueue();

    // Filter for callbacks
    const callbacks = allCalls.filter(call => {
      const status = (call.status || '').toLowerCase();
      const callbackReason = call.callbackReason;

      // Include if scheduled with VAPI for callback OR has a callback reason
      return status.includes('scheduled_with_vapi') ||
             status.includes('callback') ||
             (callbackReason && callbackReason.trim() !== '');
    });

    return callbacks.map(call => ({
      id: call.id,
      phone: call.phone,
      leadName: call.leadName,
      type: call.type,
      scheduledAt: call.estimatedCallTime || call.queuedAt,
      originalCallTime: call.queuedAt,
      callbackReason: call.callbackReason || 'Callback requested',
      priority: call.priority,
      vapiCallId: call.vapiCallId,
      email: call.email,
    }));
  }

  /**
   * Get completed/instantly called - calls that have been processed
   * These have a call outcome or VAPI call ID with completed status
   */
  async getCompletedCalls(): Promise<CompletedCall[]> {
    const allCalls = await this.getQueue();

    // Statuses that indicate the call has been completed
    const completedStatuses = [
      'completed', 'done', 'called', 'success',
      'no_answer', 'voicemail', 'not_interested',
      'busy', 'wrong_number', 'callback_completed'
    ];

    // Filter for completed calls
    const completed = allCalls.filter(call => {
      const status = (call.status || '').toLowerCase();
      const callOutcome = (call.callOutcome || '').toLowerCase();

      // Include if has completed status OR has a call outcome
      return completedStatuses.some(cs => status.includes(cs)) ||
             (callOutcome && callOutcome.trim() !== '');
    });

    return completed.map(call => ({
      id: call.id,
      phone: call.phone,
      leadName: call.leadName,
      type: call.type,
      calledAt: call.queuedAt,
      callOutcome: call.callOutcome || call.status || 'completed',
      vapiCallId: call.vapiCallId,
      email: call.email,
    }));
  }

  /**
   * Get all call data separated into categories
   */
  async getSeparatedCallData(): Promise<{
    queuedCalls: QueuedCall[];
    scheduledCallbacks: ScheduledCallback[];
    completedCalls: CompletedCall[];
  }> {
    const allCalls = await this.getQueue();

    // Statuses that indicate completion
    const completedStatuses = [
      'completed', 'done', 'called', 'success', 'failed', 'cancelled',
      'no_answer', 'voicemail', 'not_interested', 'ended', 'error',
      'busy', 'wrong_number', 'callback_completed'
    ];

    // Filter for stale entries - items older than 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const queuedCalls: QueuedCall[] = [];
    const scheduledCallbacks: ScheduledCallback[] = [];
    const completedCalls: CompletedCall[] = [];

    for (const call of allCalls) {
      const status = (call.status || '').toLowerCase();
      const callOutcome = (call.callOutcome || '').toLowerCase();
      const callbackReason = call.callbackReason;
      const queuedAt = new Date(call.queuedAt);
      const isStale = queuedAt < twentyFourHoursAgo;

      // Check if this is a scheduled callback
      const isCallback = status.includes('scheduled_with_vapi') ||
                         status.includes('callback') ||
                         (callbackReason && callbackReason.trim() !== '');

      // Check if completed
      const isCompleted = completedStatuses.some(cs => status.includes(cs)) ||
                          (callOutcome && callOutcome.trim() !== '');

      if (isCallback && !status.includes('callback_completed')) {
        // This is a scheduled callback that hasn't been completed yet
        scheduledCallbacks.push({
          id: call.id,
          phone: call.phone,
          leadName: call.leadName,
          type: call.type,
          scheduledAt: call.estimatedCallTime || call.queuedAt,
          originalCallTime: call.queuedAt,
          callbackReason: callbackReason || 'Callback requested',
          priority: call.priority,
          vapiCallId: call.vapiCallId,
          email: call.email,
        });
      } else if (isCompleted) {
        // This call has been completed
        completedCalls.push({
          id: call.id,
          phone: call.phone,
          leadName: call.leadName,
          type: call.type,
          calledAt: call.queuedAt,
          callOutcome: call.callOutcome || call.status || 'completed',
          vapiCallId: call.vapiCallId,
          email: call.email,
        });
      } else if (!isStale) {
        // This is a pending/queued call (not stale, not completed, not callback)
        queuedCalls.push(call);
      }
    }

    console.log(`[Queue Separation] Total: ${allCalls.length}, Queued: ${queuedCalls.length}, Callbacks: ${scheduledCallbacks.length}, Completed: ${completedCalls.length}`);

    return { queuedCalls, scheduledCallbacks, completedCalls };
  }
}

export const queueClient = new QueueClient();
