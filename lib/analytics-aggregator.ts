import { n8nClient } from './n8n-client';
import { vapiClient } from './vapi-client';
import { facebookLeadsClient } from './facebook-leads-client';
import { queueClient } from './queue-client';
import { getCurrentHourInAWST, AWST_OFFSET_MS } from './timezone';
import { gymMasterClient, MemberBookingStatus } from './gymmaster-client';
import {
  DashboardData,
  DashboardMetrics,
  CallVolumeData,
  CallOutcome,
  Activity,
  QueuedCall,
  ScheduledCallback,
  CompletedCall,
  VAPICall,
  FacebookLead,
  PipelineStage,
  PipelineSummary,
  PipelineStageSummary,
} from '@/types/analytics';
import { subDays } from 'date-fns';

/**
 * Calculate pipeline stage from journey data
 * Priority order: booking_confirmed > call_completed > call_pending > lead_submitted
 */
function calculatePipelineStage(journey?: FacebookLead['journey']): PipelineStage {
  if (!journey) return 'lead_submitted';

  // If booked in GymMaster, they're at the final stage
  if (journey.isBooked) {
    return 'booking_confirmed';
  }

  // If they've been contacted and have a call outcome, call is completed
  if (journey.contactedAt || journey.callOutcome || journey.callSummary) {
    return 'call_completed';
  }

  // If they're in queue or scheduled for callback, call is pending
  if (journey.queuedAt || journey.contactMethod === 'queued' || journey.callbackScheduledAt) {
    return 'call_pending';
  }

  // Default: lead just submitted
  return 'lead_submitted';
}

export type DateRangeType = 'today' | 'yesterday' | 'last7days' | 'last30days';

/**
 * Get AWST midnight-to-midnight boundaries in UTC
 * For Facebook leads: 12:00 AM AWST to 11:59 PM AWST
 * AWST midnight = UTC 16:00 (previous day)
 */
function getAWSTMidnightBoundaries(range: DateRangeType): { startDate: Date; endDate: Date } {
  const now = new Date();

  // Get current date in AWST using Intl API
  const awstFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Perth',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const awstDateStr = awstFormatter.format(now); // YYYY-MM-DD in AWST

  // Parse AWST date components
  const [year, month, day] = awstDateStr.split('-').map(Number);

  // Create midnight AWST in UTC
  // AWST midnight = UTC 16:00 previous day (midnight - 8 hours = 16:00 UTC previous day)
  // So for Jan 21 midnight AWST, we need Jan 20 16:00 UTC
  const todayMidnightAWSTinUTC = new Date(Date.UTC(year, month - 1, day - 1, 16, 0, 0, 0));

  // End of day: 11:59:59.999 PM AWST = 15:59:59.999 UTC same day
  const todayEndAWSTinUTC = new Date(Date.UTC(year, month - 1, day, 15, 59, 59, 999));

  switch (range) {
    case 'today':
      return {
        startDate: todayMidnightAWSTinUTC,
        endDate: now, // Use current time as end
      };

    case 'yesterday': {
      const yesterdayMidnight = new Date(todayMidnightAWSTinUTC.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayEnd = new Date(todayMidnightAWSTinUTC.getTime() - 1); // 11:59:59.999 PM yesterday
      return {
        startDate: yesterdayMidnight,
        endDate: yesterdayEnd,
      };
    }

    case 'last7days': {
      const sevenDaysAgo = new Date(todayMidnightAWSTinUTC.getTime() - 6 * 24 * 60 * 60 * 1000);
      return {
        startDate: sevenDaysAgo,
        endDate: now,
      };
    }

    case 'last30days': {
      const thirtyDaysAgo = new Date(todayMidnightAWSTinUTC.getTime() - 29 * 24 * 60 * 60 * 1000);
      return {
        startDate: thirtyDaysAgo,
        endDate: now,
      };
    }

    default:
      return {
        startDate: todayMidnightAWSTinUTC,
        endDate: now,
      };
  }
}

/**
 * Get the AWST noon reset boundaries in UTC
 * The "day" runs from 12:00 PM AWST to 12:00 PM AWST next day
 * Returns proper UTC timestamps for API calls
 */
function getAWSTDayBoundaries(): { startDate: Date; endDate: Date } {
  const now = new Date();
  const currentHourAWST = getCurrentHourInAWST();

  // Calculate today's noon in AWST, then convert to UTC
  // AWST noon = UTC 04:00 (12:00 - 8 hours)
  const todayUTC = new Date(now);
  todayUTC.setUTCHours(4, 0, 0, 0); // 12:00 AWST = 04:00 UTC

  let startDate: Date;
  let endDate: Date = now;

  if (currentHourAWST >= 12) {
    // After noon AWST - day started today at noon AWST (04:00 UTC)
    startDate = todayUTC;
  } else {
    // Before noon AWST - day started yesterday at noon AWST
    startDate = new Date(todayUTC.getTime() - 24 * 60 * 60 * 1000);
  }

  return { startDate, endDate };
}

/**
 * Get start and end dates based on date range filter
 * Returns proper UTC timestamps for API calls
 */
function getDateRange(range: DateRangeType): { startDate: Date; endDate: Date } {
  const now = new Date();
  const currentHourAWST = getCurrentHourInAWST();

  // Today's noon in UTC (AWST noon = UTC 04:00)
  const todayNoonUTC = new Date(now);
  todayNoonUTC.setUTCHours(4, 0, 0, 0);

  switch (range) {
    case 'today':
      return getAWSTDayBoundaries();

    case 'yesterday': {
      // Yesterday noon AWST to today noon AWST
      const yesterdayNoonUTC = new Date(todayNoonUTC.getTime() - 24 * 60 * 60 * 1000);
      return {
        startDate: yesterdayNoonUTC,
        endDate: todayNoonUTC,
      };
    }

    case 'last7days': {
      // 7 days ago noon AWST to now
      const sevenDaysAgoNoonUTC = new Date(todayNoonUTC.getTime() - 6 * 24 * 60 * 60 * 1000);
      // If before noon, start from 8 days ago
      if (currentHourAWST < 12) {
        sevenDaysAgoNoonUTC.setTime(sevenDaysAgoNoonUTC.getTime() - 24 * 60 * 60 * 1000);
      }
      return {
        startDate: sevenDaysAgoNoonUTC,
        endDate: now,
      };
    }

    case 'last30days': {
      // 30 days ago noon AWST to now
      const thirtyDaysAgoNoonUTC = new Date(todayNoonUTC.getTime() - 29 * 24 * 60 * 60 * 1000);
      // If before noon, start from 31 days ago
      if (currentHourAWST < 12) {
        thirtyDaysAgoNoonUTC.setTime(thirtyDaysAgoNoonUTC.getTime() - 24 * 60 * 60 * 1000);
      }
      return {
        startDate: thirtyDaysAgoNoonUTC,
        endDate: now,
      };
    }

    default:
      return getAWSTDayBoundaries();
  }
}

export class AnalyticsAggregator {
  async getDashboardData(dateRange: string = 'today'): Promise<DashboardData> {
    // Use midnight-to-midnight AWST boundaries for all data (12:00 AM to 11:59 PM AWST)
    const { startDate, endDate } = getAWSTMidnightBoundaries(dateRange as DateRangeType);

    // Debug: Log date range being used
    console.log('[Analytics] Date range for data fetch:', {
      dateRange,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startDateLocal: startDate.toLocaleString('en-AU', { timeZone: 'Australia/Perth' }),
      endDateLocal: endDate.toLocaleString('en-AU', { timeZone: 'Australia/Perth' }),
    });

    // Fetch data from all sources in parallel
    // Primary queue source: Google Sheet via n8n webhook (with fallback)
    // Also fetch VAPI scheduled calls directly from VAPI API
    // Bookings: From n8n execution data (is_booked flag) - tracks FB ad leads only
    // All data uses midnight-to-midnight AWST boundaries
    const [n8nExecutions, vapiCalls, separatedCallData, facebookLeads, vapiScheduledCalls] = await Promise.all([
      n8nClient.getCallData(startDate, endDate).catch((err) => {
        console.error('Failed to fetch n8n executions:', err);
        return [];
      }),
      vapiClient.getCalls(startDate, endDate).catch((err) => {
        console.error('Failed to fetch VAPI calls:', err);
        return [];
      }),
      queueClient.getSeparatedCallData().catch((err) => {
        console.error('Failed to fetch separated queue data:', err);
        return { queuedCalls: [], scheduledCallbacks: [], completedCalls: [] };
      }),
      facebookLeadsClient.getLeads(startDate, endDate).catch((err) => {
        console.error('Failed to fetch Facebook leads:', err);
        return [];
      }),
      vapiClient.getScheduledCalls().catch((err) => {
        console.error('Failed to fetch VAPI scheduled calls:', err);
        return [];
      }),
    ]);

    // Combine and aggregate data
    const metrics = this.calculateMetrics(n8nExecutions, vapiCalls);
    const callVolume = this.calculateCallVolume(vapiCalls);
    const outcomes = this.calculateOutcomes(vapiCalls, n8nExecutions);
    const recentActivity = this.getRecentActivity(n8nExecutions, vapiCalls);

    // Get set of phone numbers that have been called (from VAPI completed calls)
    // Normalize phone numbers for comparison
    const calledPhones = new Set<string>();
    const vapiCallsByPhone = new Map<string, VAPICall>();

    for (const call of vapiCalls) {
      if (call.phoneNumber) {
        const normalizedPhone = this.normalizePhone(call.phoneNumber);
        calledPhones.add(normalizedPhone);
        // Keep the most recent call for each phone
        const existing = vapiCallsByPhone.get(normalizedPhone);
        if (!existing || new Date(call.startedAt) > new Date(existing.startedAt)) {
          vapiCallsByPhone.set(normalizedPhone, call);
        }
      }
    }

    console.log(`[Analytics] VAPI completed calls phones: ${calledPhones.size}`);

    // Filter queue entries - remove any that have already been called
    const stillQueuedCalls: QueuedCall[] = [];
    const movedToCompleted: CompletedCall[] = [];

    for (const queuedCall of separatedCallData.queuedCalls) {
      const normalizedPhone = this.normalizePhone(queuedCall.phone);
      const vapiCall = vapiCallsByPhone.get(normalizedPhone);

      if (vapiCall) {
        // This queue entry has been called - move to completed
        movedToCompleted.push({
          id: queuedCall.id,
          phone: queuedCall.phone,
          leadName: queuedCall.leadName,
          type: queuedCall.type,
          calledAt: vapiCall.startedAt,
          callOutcome: vapiCall.outcome || vapiCall.status || 'completed',
          callDuration: vapiCall.duration,
          vapiCallId: vapiCall.id,
          summary: vapiCall.summary,
          email: queuedCall.email,
        });
      } else {
        // Not yet called - keep in queue
        stillQueuedCalls.push(queuedCall);
      }
    }

    console.log(`[Analytics] Queue filter: ${separatedCallData.queuedCalls.length} -> ${stillQueuedCalls.length} still queued, ${movedToCompleted.length} moved to completed`);

    // Convert VAPI scheduled calls to QueuedCall format (only if not already called)
    const vapiScheduledAsQueued: QueuedCall[] = vapiScheduledCalls
      .filter(sc => !calledPhones.has(this.normalizePhone(sc.phone))) // Filter out already called
      .map(sc => ({
        id: `vapi-${sc.id}`,
        phone: sc.phone,
        leadName: sc.leadName,
        type: 'outbound' as const,
        queuedAt: sc.scheduledAt,
        estimatedCallTime: sc.scheduledAt, // VAPI scheduled calls have their scheduled time
        priority: 'medium' as const,
        workflowName: 'VAPI Scheduled',
        status: sc.status,
        vapiCallId: sc.id,
      }));

    // Merge queue data with VAPI scheduled calls
    // Avoid duplicates by checking if phone already exists in queue
    const existingPhones = new Set(stillQueuedCalls.map(c => c.phone));
    const uniqueVapiScheduled = vapiScheduledAsQueued.filter(c => !existingPhones.has(c.phone));

    console.log(`[Analytics] VAPI scheduled calls: ${vapiScheduledCalls.length}, unique to add: ${uniqueVapiScheduled.length}`);

    // Use separated queue data - queued, callbacks, and completed calls
    // Merge VAPI scheduled calls with queue data
    const mergedQueuedCalls = [...stillQueuedCalls, ...uniqueVapiScheduled];
    const queuedCalls = this.sortQueuedCalls(mergedQueuedCalls);
    const scheduledCallbacks = this.sortScheduledCallbacks(separatedCallData.scheduledCallbacks);

    // Merge completed calls from queue separation + moved from queue
    const allCompletedCalls = [...separatedCallData.completedCalls, ...movedToCompleted];
    const completedCalls = this.sortCompletedCalls(allCompletedCalls);

    // Sort VAPI calls by time (most recent first) for call summaries display
    const sortedVapiCalls = [...vapiCalls].sort((a, b) =>
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    // Enrich Facebook leads with journey data from VAPI calls and queue
    let enrichedFacebookLeads = this.enrichFacebookLeadsWithJourney(
      facebookLeads,
      vapiCalls,
      separatedCallData.queuedCalls,
      separatedCallData.scheduledCallbacks,
      separatedCallData.completedCalls
    );

    // Check GymMaster booking status for all leads (auto-check on every refresh)
    enrichedFacebookLeads = await this.checkGymMasterBookings(enrichedFacebookLeads);

    return {
      metrics,
      callVolume,
      outcomes,
      recentActivity,
      queuedCalls,
      scheduledCallbacks,
      completedCalls,
      vapiCalls: sortedVapiCalls,
      facebookLeads: enrichedFacebookLeads,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Enrich Facebook leads with journey data from VAPI calls and queue
   * Correlates leads by phone number to build complete journey timeline
   */
  private enrichFacebookLeadsWithJourney(
    leads: FacebookLead[],
    vapiCalls: VAPICall[],
    queuedCalls: QueuedCall[],
    scheduledCallbacks: ScheduledCallback[],
    completedCalls: CompletedCall[]
  ): FacebookLead[] {
    // Create phone-to-data maps for quick lookup
    const vapiCallsByPhone = new Map<string, VAPICall[]>();
    const queuedByPhone = new Map<string, QueuedCall>();
    const callbacksByPhone = new Map<string, ScheduledCallback>();
    const completedByPhone = new Map<string, CompletedCall>();

    // Index VAPI calls by phone
    vapiCalls.forEach(call => {
      const phone = this.normalizePhone(call.phoneNumber);
      if (phone) {
        const existing = vapiCallsByPhone.get(phone) || [];
        existing.push(call);
        vapiCallsByPhone.set(phone, existing);
      }
    });

    // Index queue data by phone
    queuedCalls.forEach(call => {
      const phone = this.normalizePhone(call.phone);
      if (phone) queuedByPhone.set(phone, call);
    });

    scheduledCallbacks.forEach(callback => {
      const phone = this.normalizePhone(callback.phone);
      if (phone) callbacksByPhone.set(phone, callback);
    });

    completedCalls.forEach(call => {
      const phone = this.normalizePhone(call.phone);
      if (phone) completedByPhone.set(phone, call);
    });

    // Enrich each lead
    return leads.map(lead => {
      const phone = this.normalizePhone(lead.phone);
      if (!phone) return lead;

      // Get matching data
      const matchingVapiCalls = vapiCallsByPhone.get(phone) || [];
      const queuedCall = queuedByPhone.get(phone);
      const scheduledCallback = callbacksByPhone.get(phone);
      const completedCall = completedByPhone.get(phone);

      // Start with existing journey or create new one
      const journey: NonNullable<FacebookLead['journey']> = lead.journey ? { ...lead.journey } : {};

      // Track if lead was originally queued (for showing queued -> called transition)
      const wasQueued = queuedCall !== undefined || journey.queuedAt !== undefined;

      // If there's a queued call record, capture the queue time
      if (queuedCall && !journey.queuedAt) {
        journey.queuedAt = queuedCall.queuedAt;
      }

      // Check if the lead has been called (completed call or VAPI calls exist)
      const hasBeenCalled = completedCall !== undefined || matchingVapiCalls.length > 0;

      // Determine contact method based on queue status and call status
      if (hasBeenCalled) {
        // Lead has been called - update contact method
        if (wasQueued) {
          // Was queued, now called - show as "queued" but with contacted data
          journey.contactMethod = 'queued';
        } else {
          // Direct/instant call
          journey.contactMethod = 'instant';
        }

        // Get contact time from completed call or VAPI
        if (completedCall) {
          journey.contactedAt = completedCall.calledAt;
          journey.callOutcome = journey.callOutcome || completedCall.callOutcome;
          journey.vapiCallId = journey.vapiCallId || completedCall.vapiCallId;
        }
      } else if (wasQueued && !journey.contactMethod) {
        // Still in queue, not yet called
        journey.contactMethod = 'queued';
      }

      // Check for callback
      if (scheduledCallback) {
        journey.callbackRequested = true;
        journey.callbackScheduledAt = scheduledCallback.scheduledAt;
        journey.callbackReason = scheduledCallback.callbackReason;
      }

      // Enrich with VAPI call data (most recent first)
      if (matchingVapiCalls.length > 0) {
        // Sort by time, most recent first
        const sortedCalls = [...matchingVapiCalls].sort(
          (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );

        const latestCall = sortedCalls[0];

        // Set contact time if not already set
        if (!journey.contactedAt) {
          journey.contactedAt = latestCall.startedAt;
        }

        // Get call outcome if not already set
        if (!journey.callOutcome && latestCall.outcome) {
          journey.callOutcome = latestCall.outcome;
        }

        // Get call summary if not already set
        if (!journey.callSummary && latestCall.summary) {
          journey.callSummary = latestCall.summary;
        }

        // Get call duration
        if (!journey.callDuration && latestCall.duration) {
          journey.callDuration = latestCall.duration;
        }

        // Set VAPI call ID
        if (!journey.vapiCallId) {
          journey.vapiCallId = latestCall.id;
        }

        // Track total attempts
        journey.totalAttempts = sortedCalls.length;
        journey.lastAttemptAt = latestCall.startedAt;

        // Check if callback was requested based on outcome
        if (latestCall.outcome?.toLowerCase().includes('callback')) {
          journey.callbackRequested = true;
        }
      }

      // Calculate pipeline stage based on journey data
      journey.pipelineStage = calculatePipelineStage(journey);
      journey.stageUpdatedAt = new Date().toISOString();

      // Update lead status based on enriched journey
      // Priority: booked > not_interested > contacted > qualified > new
      let newStatus = lead.status;
      if (journey.isBooked) {
        newStatus = 'booked';
      } else if (journey.callOutcome) {
        if (journey.callOutcome === 'not_interested' || journey.callOutcome === 'wrong_number') {
          newStatus = 'not_interested';
        } else {
          newStatus = 'contacted';
        }
      } else if (journey.contactedAt) {
        // Has been contacted (has a contact time)
        newStatus = 'contacted';
      } else if (journey.isMember) {
        newStatus = 'qualified';
      } else if (journey.contactMethod === 'queued' && !journey.contactedAt) {
        // Still queued, not yet contacted - keep as 'new' since not actually contacted yet
        newStatus = 'new';
      }

      // Return enriched lead
      return {
        ...lead,
        status: newStatus,
        journey: Object.keys(journey).length > 0 ? journey : undefined,
      };
    });
  }

  /**
   * Normalize phone number for comparison
   * Removes country code prefixes and non-digit characters
   */
  private normalizePhone(phone?: string): string {
    if (!phone) return '';

    // Handle object phone numbers from VAPI
    if (typeof phone === 'object' && (phone as any).number) {
      phone = (phone as any).number;
    }

    // Remove all non-digit characters
    let digits = String(phone).replace(/\D/g, '');

    // Remove common country codes for Australia
    if (digits.startsWith('61') && digits.length === 11) {
      digits = '0' + digits.slice(2);
    }
    if (digits.startsWith('+61')) {
      digits = '0' + digits.slice(3);
    }

    return digits;
  }

  /**
   * Sort queued calls by priority (high > medium > low) then by queued time
   */
  private sortQueuedCalls(calls: QueuedCall[]): QueuedCall[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    return calls.sort((a, b) => {
      // First sort by priority
      const priorityA = priorityOrder[a.priority || 'medium'];
      const priorityB = priorityOrder[b.priority || 'medium'];

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Then sort by scheduled time if available (soonest first), otherwise by queued time
      const timeA = a.estimatedCallTime ? new Date(a.estimatedCallTime).getTime() : new Date(a.queuedAt).getTime();
      const timeB = b.estimatedCallTime ? new Date(b.estimatedCallTime).getTime() : new Date(b.queuedAt).getTime();
      return timeA - timeB;
    });
  }

  /**
   * Sort scheduled callbacks by scheduled time (soonest first), then by priority
   */
  private sortScheduledCallbacks(callbacks: ScheduledCallback[]): ScheduledCallback[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    return callbacks.sort((a, b) => {
      // First sort by scheduled time (soonest first)
      const timeA = new Date(a.scheduledAt).getTime();
      const timeB = new Date(b.scheduledAt).getTime();

      if (timeA !== timeB) {
        return timeA - timeB;
      }

      // Then by priority
      const priorityA = priorityOrder[a.priority || 'medium'];
      const priorityB = priorityOrder[b.priority || 'medium'];
      return priorityA - priorityB;
    });
  }

  /**
   * Sort completed calls by time (most recent first)
   */
  private sortCompletedCalls(calls: CompletedCall[]): CompletedCall[] {
    return calls.sort((a, b) => {
      return new Date(b.calledAt).getTime() - new Date(a.calledAt).getTime();
    });
  }

  /**
   * Calculate pipeline summary from enriched Facebook leads
   */
  calculatePipelineSummary(leads: FacebookLead[]): PipelineSummary {
    const byStage: Record<PipelineStage, number> = {
      'lead_submitted': 0,
      'call_pending': 0,
      'call_completed': 0,
      'booking_confirmed': 0,
    };

    let totalTimeToCall = 0;
    let callCount = 0;
    let totalTimeToBooking = 0;
    let bookingCount = 0;

    leads.forEach(lead => {
      const stage = lead.journey?.pipelineStage || calculatePipelineStage(lead.journey);
      byStage[stage]++;

      // Calculate time metrics
      const leadTime = new Date(lead.createdTime).getTime();

      if (lead.journey?.contactedAt) {
        const callTime = new Date(lead.journey.contactedAt).getTime();
        totalTimeToCall += (callTime - leadTime) / 1000; // seconds
        callCount++;
      }

      if (lead.journey?.isBooked && lead.journey?.contactedAt) {
        // Use contacted time as approximation for booking time
        const bookingTime = new Date(lead.journey.contactedAt).getTime();
        totalTimeToBooking += (bookingTime - leadTime) / 1000;
        bookingCount++;
      }
    });

    const totalLeads = leads.length;
    const conversionRate = totalLeads > 0
      ? (byStage['booking_confirmed'] / totalLeads) * 100
      : 0;

    const stages: PipelineStageSummary[] = [
      {
        stage: 'lead_submitted',
        count: byStage['lead_submitted'],
        percentage: totalLeads > 0 ? (byStage['lead_submitted'] / totalLeads) * 100 : 0,
      },
      {
        stage: 'call_pending',
        count: byStage['call_pending'],
        percentage: totalLeads > 0 ? (byStage['call_pending'] / totalLeads) * 100 : 0,
      },
      {
        stage: 'call_completed',
        count: byStage['call_completed'],
        percentage: totalLeads > 0 ? (byStage['call_completed'] / totalLeads) * 100 : 0,
      },
      {
        stage: 'booking_confirmed',
        count: byStage['booking_confirmed'],
        percentage: totalLeads > 0 ? (byStage['booking_confirmed'] / totalLeads) * 100 : 0,
      },
    ];

    return {
      totalLeads,
      byStage,
      stages,
      conversionRate: Number(conversionRate.toFixed(1)),
      avgTimeToCall: callCount > 0 ? Math.round(totalTimeToCall / callCount) : null,
      avgTimeToBooking: bookingCount > 0 ? Math.round(totalTimeToBooking / bookingCount) : null,
    };
  }

  /**
   * Check GymMaster booking status for all leads
   * Updates leads with real-time booking data from GymMaster
   */
  async checkGymMasterBookings(leads: FacebookLead[]): Promise<FacebookLead[]> {
    if (!gymMasterClient.isConfigured()) {
      console.log('[Analytics] GymMaster not configured, skipping booking check');
      return leads;
    }

    // Get phones that need checking (not already confirmed booked)
    const phonesToCheck = leads
      .filter(lead => lead.phone && !lead.journey?.isBooked)
      .map(lead => lead.phone!)
      .filter((phone, index, arr) => arr.indexOf(phone) === index); // unique

    if (phonesToCheck.length === 0) {
      return leads;
    }

    console.log(`[Analytics] Checking GymMaster booking status for ${phonesToCheck.length} leads`);

    try {
      // Batch check all phones
      const bookingStatuses = await gymMasterClient.batchCheckBookingStatus(phonesToCheck);

      // Update leads with GymMaster data
      return leads.map(lead => {
        if (!lead.phone) return lead;

        const normalizedPhone = this.normalizePhone(lead.phone);
        const status = bookingStatuses.get(normalizedPhone);

        if (!status) return lead;

        // Update journey with GymMaster data
        const journey: NonNullable<FacebookLead['journey']> = lead.journey ? { ...lead.journey } : {};

        journey.gymMasterChecked = true;
        journey.isMember = status.isMember;
        journey.isBooked = status.hasBooking;

        if (status.memberId) {
          journey.memberId = status.memberId;
        }

        if (status.upcomingBookings.length > 0) {
          journey.bookingDetails = status.upcomingBookings.map(b => ({
            day: b.day,
            startTime: b.startTime,
            serviceName: b.serviceName,
          }));
        }

        // Recalculate pipeline stage with new booking data
        journey.pipelineStage = calculatePipelineStage(journey);
        journey.stageUpdatedAt = new Date().toISOString();

        // Update lead status if booked
        let newStatus = lead.status;
        if (journey.isBooked) {
          newStatus = 'booked';
        } else if (journey.isMember && newStatus === 'new') {
          newStatus = 'qualified';
        }

        return {
          ...lead,
          status: newStatus,
          journey,
        };
      });
    } catch (error) {
      console.error('[Analytics] Error checking GymMaster bookings:', error);
      return leads;
    }
  }

  private calculateMetrics(n8nExecutions: any[], vapiCalls: any[]): DashboardMetrics {
    // Total calls from VAPI
    const totalCalls = vapiCalls.length;

    // IMPORTANT: "Booked" should only count Facebook ad leads that booked
    // Use n8n execution data with is_booked flag (these are FB leads processed by our workflow)
    // GymMaster KPI includes ALL bookings (walk-ins, website, etc.) - not useful for FB lead tracking
    const totalBookings = n8nExecutions.filter(e => {
      return e.data.isBooked === true || e.data.booked === true;
    }).length;

    // Conversion rate
    const conversionRate = totalCalls > 0 ? (totalBookings / totalCalls) * 100 : 0;

    // Average lead score from n8n
    const scoresWithValues = n8nExecutions
      .map(e => e.data.leadScore)
      .filter((score): score is number => typeof score === 'number');
    const avgLeadScore = scoresWithValues.length > 0
      ? scoresWithValues.reduce((a, b) => a + b, 0) / scoresWithValues.length
      : 0;

    // Calculate trends (placeholder - would need yesterday's data)
    const callsTrend = 0;
    const bookingsTrend = 0;
    const conversionTrend = 0;
    const scoreTrend = 0;

    return {
      totalCalls,
      totalBookings,
      conversionRate: Number(conversionRate.toFixed(1)),
      avgLeadScore: Number(avgLeadScore.toFixed(0)),
      callsTrend,
      bookingsTrend,
      conversionTrend,
      scoreTrend,
    };
  }

  private calculateCallVolume(vapiCalls: any[]): CallVolumeData[] {
    // Initialize 24 hours
    const hourlyData: CallVolumeData[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      inbound: 0,
      outbound: 0,
    }));

    // Aggregate calls by hour (in AWST timezone)
    vapiCalls.forEach(call => {
      // Convert call time to AWST for correct hour bucketing
      const callDate = new Date(call.startedAt);
      // Use Intl.DateTimeFormat to get the hour in AWST
      const awstHourFormatter = new Intl.DateTimeFormat('en-AU', {
        timeZone: 'Australia/Perth',
        hour: 'numeric',
        hour12: false,
      });
      const hourStr = awstHourFormatter.format(callDate);
      const hour = parseInt(hourStr, 10);

      if (call.type === 'inbound') {
        hourlyData[hour].inbound++;
      } else {
        hourlyData[hour].outbound++;
      }
    });

    return hourlyData;
  }

  private calculateOutcomes(vapiCalls: any[], n8nExecutions: any[]): CallOutcome[] {
    // Outcomes tracking (for FB ad leads only):
    // - booked = FB lead confirmed booked via n8n is_booked flag
    // - linkSent = booking_link_sent call outcome - Lead interested, link sent (NOT confirmed)
    // - noAnswer = no_answer, busy
    // - voicemail = voicemail
    // - notInterested = not_interested, wrong_number
    // - other = callback_requested, unknown, completed (successful conversation but no booking)
    const outcomeCounts = {
      booked: 0,        // FB leads that confirmed booking (is_booked === true)
      linkSent: 0,      // booking_link_sent - lead interested, link sent (not confirmed)
      noAnswer: 0,      // no_answer, busy
      voicemail: 0,     // voicemail
      notInterested: 0, // not_interested, wrong_number
      other: 0,         // callback_requested, completed, unknown
    };

    // Create a set of phones with confirmed bookings from n8n
    const bookedPhones = new Set<string>();
    n8nExecutions.forEach(exec => {
      if (exec.data.isBooked === true || exec.data.booked === true) {
        const phone = this.normalizePhone(exec.data.phone);
        if (phone) bookedPhones.add(phone);
      }
    });

    // Count FB lead bookings from n8n executions (is_booked flag)
    // This only counts leads processed by our workflow, not all GymMaster bookings
    outcomeCounts.booked = bookedPhones.size;

    // Count call outcomes from VAPI calls
    // Track processed phones to avoid double-counting
    const processedPhones = new Set<string>();

    vapiCalls.forEach(call => {
      const phone = this.normalizePhone(call.phoneNumber);
      const outcome = (call.outcome || call.status || '').toLowerCase();

      // Skip if this phone was already confirmed booked (counted above)
      if (phone && bookedPhones.has(phone)) {
        return;
      }

      // Skip if we've already processed a call from this phone
      // (We only want to count each lead once based on their most recent call outcome)
      if (phone && processedPhones.has(phone)) {
        return;
      }
      if (phone) processedPhones.add(phone);

      // "booking_link_sent" = link sent, NOT confirmed booking
      if (outcome === 'booking_link_sent' || outcome.includes('booking_link') || outcome.includes('link_sent')) {
        outcomeCounts.linkSent++;
      } else if (outcome === 'no_answer' || outcome === 'no-answer' || outcome === 'busy' || outcome.includes('no answer') || outcome === 'customer-did-not-answer') {
        outcomeCounts.noAnswer++;
      } else if (outcome === 'voicemail' || outcome.includes('voicemail')) {
        outcomeCounts.voicemail++;
      } else if (outcome === 'not_interested' || outcome === 'wrong_number' || outcome.includes('not interested') || outcome.includes('wrong') || outcome === 'not-interested') {
        outcomeCounts.notInterested++;
      } else {
        // callback_requested, completed (successful call, no specific outcome), and other outcomes
        outcomeCounts.other++;
      }
    });

    // Calculate total for percentage (all outcome categories combined)
    const total = outcomeCounts.booked + outcomeCounts.linkSent + outcomeCounts.noAnswer +
                  outcomeCounts.voicemail + outcomeCounts.notInterested + outcomeCounts.other || 1;

    return [
      {
        type: 'booked',
        count: outcomeCounts.booked,
        percentage: Number(((outcomeCounts.booked / total) * 100).toFixed(1)),
      },
      {
        type: 'linkSent',
        count: outcomeCounts.linkSent,
        percentage: Number(((outcomeCounts.linkSent / total) * 100).toFixed(1)),
      },
      {
        type: 'noAnswer',
        count: outcomeCounts.noAnswer,
        percentage: Number(((outcomeCounts.noAnswer / total) * 100).toFixed(1)),
      },
      {
        type: 'voicemail',
        count: outcomeCounts.voicemail,
        percentage: Number(((outcomeCounts.voicemail / total) * 100).toFixed(1)),
      },
      {
        type: 'notInterested',
        count: outcomeCounts.notInterested,
        percentage: Number(((outcomeCounts.notInterested / total) * 100).toFixed(1)),
      },
      {
        type: 'other',
        count: outcomeCounts.other,
        percentage: Number(((outcomeCounts.other / total) * 100).toFixed(1)),
      },
    ];
  }

  private getRecentActivity(n8nExecutions: any[], vapiCalls: any[]): Activity[] {
    const activities: Activity[] = [];

    // Outcome mapping for call outcomes (VAPI Status Handler workflow)
    // - 'booked' = n8n execution with is_booked flag (confirmed in GymMaster)
    // - 'linkSent' = booking_link_sent call outcome (interested, link sent, NOT confirmed)
    const outcomeMap: Record<string, Activity['outcome']> = {
      'booking_link_sent': 'linkSent', // Link sent, but not confirmed booking
      'booked': 'booked',              // Only if n8n confirms via is_booked flag
      'no_answer': 'noAnswer',
      'no-answer': 'noAnswer',
      'busy': 'noAnswer',
      'voicemail': 'voicemail',
      'not_interested': 'notInterested',
      'not-interested': 'notInterested',
      'wrong_number': 'notInterested',
      'callback_requested': 'other',
    };

    // Create a map of VAPI calls by phone number + time for quick lookup
    const vapiCallMap = new Map<string, any>();
    vapiCalls.forEach(call => {
      if (call.phoneNumber) {
        // Use phone + rounded timestamp as key for matching
        const timeKey = Math.floor(new Date(call.startedAt).getTime() / 60000); // Round to minute
        const key = `${call.phoneNumber}_${timeKey}`;
        vapiCallMap.set(key, call);
      }
    });

    // Convert n8n executions to activities (preferred source for detailed data)
    n8nExecutions.forEach(exec => {
      if (exec.data.phone) {
        const leadName = exec.data.fullName ||
          (exec.data.firstName && exec.data.lastName
            ? `${exec.data.firstName} ${exec.data.lastName}`
            : exec.data.firstName || exec.data.lastName || 'Unknown');

        // Determine outcome - check n8n data first, then call outcome
        let outcome: Activity['outcome'] = 'other';
        const rawOutcome = (exec.data.outcome || '').toLowerCase();

        // FIRST: Check n8n execution data for is_booked flag (confirmed in GymMaster)
        if (exec.data.isBooked === true || exec.data.booked === true) {
          outcome = 'booked';
        }
        // SECOND: Use call outcome mapping
        else if (outcomeMap[rawOutcome]) {
          outcome = outcomeMap[rawOutcome];
        }

        // Try to find matching VAPI call for additional data
        const timeKey = Math.floor(new Date(exec.startedAt).getTime() / 60000);
        const vapiKey = `${exec.data.phone}_${timeKey}`;
        const matchingVapiCall = vapiCallMap.get(vapiKey);

        // Get call summary - prefer n8n data, fallback to VAPI
        let callSummary = exec.data.callSummary;
        if (!callSummary && matchingVapiCall?.summary) {
          callSummary = matchingVapiCall.summary;
        }

        // Get lead name - prefer n8n data, fallback to VAPI
        let finalLeadName = leadName;
        if (finalLeadName === 'Unknown' && matchingVapiCall?.leadName) {
          finalLeadName = matchingVapiCall.leadName;
        }

        // If we matched a VAPI call, remove it from the map so we don't add it again
        if (matchingVapiCall) {
          vapiCallMap.delete(vapiKey);
        }

        activities.push({
          id: exec.id,
          time: exec.startedAt,
          type: exec.data.callType || matchingVapiCall?.type || 'outbound',
          phone: exec.data.phone,
          leadName: finalLeadName,
          outcome,
          leadScore: exec.data.leadScore,
          email: exec.data.email,
          callSummary,
        });
      }
    });

    // Add remaining VAPI calls that weren't matched to n8n executions
    vapiCallMap.forEach(call => {
      const rawOutcome = (call.outcome || call.status || '').toLowerCase();
      const outcome: Activity['outcome'] = outcomeMap[rawOutcome] || 'other';

      // Ensure phone is always a string (VAPI can return object with {number, id, ...})
      let phone = '';
      if (typeof call.phoneNumber === 'string') {
        phone = call.phoneNumber;
      } else if (call.phoneNumber?.number) {
        phone = call.phoneNumber.number;
      }

      activities.push({
        id: call.id,
        time: call.startedAt,
        type: call.type,
        phone,
        leadName: call.leadName || 'Unknown',
        outcome,
        callSummary: call.summary,
      });
    });

    // Sort by time (most recent first)
    const sortedActivities = activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Deduplicate: Keep only ONE entry per phone number for the entire day
    // Shows the most recent call attempt for each unique phone number
    const deduplicatedActivities: Activity[] = [];
    const seenPhones = new Set<string>();

    for (const activity of sortedActivities) {
      if (!activity.phone) {
        deduplicatedActivities.push(activity);
        continue;
      }

      // Only include if we haven't seen this phone number yet today
      if (!seenPhones.has(activity.phone)) {
        deduplicatedActivities.push(activity);
        seenPhones.add(activity.phone);
      }
    }

    return deduplicatedActivities.slice(0, 20);
  }

}

export const analyticsAggregator = new AnalyticsAggregator();
