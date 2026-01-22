import { n8nClient } from './n8n-client';
import { vapiClient } from './vapi-client';
import { facebookLeadsClient } from './facebook-leads-client';
import { queueClient } from './queue-client';
import { getCurrentHourInAWST, AWST_OFFSET_MS } from './timezone';
// GymMaster client available for future use (e.g., displaying total gym bookings separately)
// import { gymMasterClient, GymMasterBookingSummary } from './gymmaster-client';
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
} from '@/types/analytics';
import { subDays } from 'date-fns';

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

    // Fetch data from all sources in parallel
    // Primary queue source: Google Sheet via n8n webhook (with fallback)
    // Bookings: From n8n execution data (is_booked flag) - tracks FB ad leads only
    // All data uses midnight-to-midnight AWST boundaries
    const [n8nExecutions, vapiCalls, separatedCallData, facebookLeads] = await Promise.all([
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
    ]);

    // Combine and aggregate data
    const metrics = this.calculateMetrics(n8nExecutions, vapiCalls);
    const callVolume = this.calculateCallVolume(vapiCalls);
    const outcomes = this.calculateOutcomes(vapiCalls, n8nExecutions);
    const recentActivity = this.getRecentActivity(n8nExecutions, vapiCalls);

    // Use separated queue data - queued, callbacks, and completed calls
    const queuedCalls = this.sortQueuedCalls(separatedCallData.queuedCalls);
    const scheduledCallbacks = this.sortScheduledCallbacks(separatedCallData.scheduledCallbacks);
    const completedCalls = this.sortCompletedCalls(separatedCallData.completedCalls);

    // Sort VAPI calls by time (most recent first) for call summaries display
    const sortedVapiCalls = [...vapiCalls].sort((a, b) =>
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    // Enrich Facebook leads with journey data from VAPI calls and queue
    const enrichedFacebookLeads = this.enrichFacebookLeadsWithJourney(
      facebookLeads,
      vapiCalls,
      separatedCallData.queuedCalls,
      separatedCallData.scheduledCallbacks,
      separatedCallData.completedCalls
    );

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

      // Then sort by queued time (earliest first)
      return new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime();
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

    // Aggregate calls by hour
    vapiCalls.forEach(call => {
      const hour = new Date(call.startedAt).getHours();
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
    // - other = callback_requested, unknown
    const outcomeCounts = {
      booked: 0,        // FB leads that confirmed booking (is_booked === true)
      linkSent: 0,      // booking_link_sent - lead interested, link sent (not confirmed)
      noAnswer: 0,      // no_answer, busy
      voicemail: 0,     // voicemail
      notInterested: 0, // not_interested, wrong_number
      other: 0,         // callback_requested, unknown
    };

    // Count FB lead bookings from n8n executions (is_booked flag)
    // This only counts leads processed by our workflow, not all GymMaster bookings
    outcomeCounts.booked = n8nExecutions.filter(exec =>
      exec.data.isBooked === true || exec.data.booked === true
    ).length;

    // Count call outcomes from VAPI calls
    vapiCalls.forEach(call => {
      const outcome = (call.outcome || call.status || '').toLowerCase();

      // "booking_link_sent" = link sent, NOT confirmed booking
      if (outcome === 'booking_link_sent' || outcome.includes('booking_link')) {
        outcomeCounts.linkSent++;
      } else if (outcome === 'no_answer' || outcome === 'no-answer' || outcome === 'busy' || outcome.includes('no answer')) {
        outcomeCounts.noAnswer++;
      } else if (outcome === 'voicemail') {
        outcomeCounts.voicemail++;
      } else if (outcome === 'not_interested' || outcome === 'wrong_number' || outcome.includes('not interested') || outcome.includes('wrong')) {
        outcomeCounts.notInterested++;
      } else {
        // callback_requested and other outcomes go here
        outcomeCounts.other++;
      }
    });

    const total = vapiCalls.length || 1;

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
