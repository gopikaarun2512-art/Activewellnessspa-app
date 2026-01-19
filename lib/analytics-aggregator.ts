import { n8nClient } from './n8n-client';
import { vapiClient } from './vapi-client';
import { facebookLeadsClient } from './facebook-leads-client';
import { queueClient } from './queue-client';
// GymMaster client available for future use (e.g., displaying total gym bookings separately)
// import { gymMasterClient, GymMasterBookingSummary } from './gymmaster-client';
import {
  DashboardData,
  DashboardMetrics,
  CallVolumeData,
  CallOutcome,
  Activity,
  QueuedCall,
  FacebookLead,
} from '@/types/analytics';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export type DateRangeType = 'today' | 'yesterday' | 'last7days' | 'last30days';

/**
 * Get start and end dates based on date range filter
 */
function getDateRange(range: DateRangeType): { startDate: Date; endDate: Date } {
  const now = new Date();

  switch (range) {
    case 'today':
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now),
      };
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday),
      };
    case 'last7days':
      return {
        startDate: startOfDay(subDays(now, 6)),
        endDate: endOfDay(now),
      };
    case 'last30days':
      return {
        startDate: startOfDay(subDays(now, 29)),
        endDate: endOfDay(now),
      };
    default:
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now),
      };
  }
}

export class AnalyticsAggregator {
  async getDashboardData(dateRange: string = 'today'): Promise<DashboardData> {
    // Get date range boundaries
    const { startDate, endDate } = getDateRange(dateRange as DateRangeType);

    // Fetch data from all sources in parallel
    // Primary queue source: Google Sheet via n8n webhook (with fallback)
    // Bookings: From n8n execution data (is_booked flag) - tracks FB ad leads only
    const [n8nExecutions, vapiCalls, sheetQueuedCalls, facebookLeads] = await Promise.all([
      n8nClient.getCallData(startDate, endDate).catch((err) => {
        console.error('Failed to fetch n8n executions:', err);
        return [];
      }),
      vapiClient.getCalls(startDate, endDate).catch((err) => {
        console.error('Failed to fetch VAPI calls:', err);
        return [];
      }),
      queueClient.getQueuedCalls().catch((err) => {
        console.error('Failed to fetch queue from sheet:', err);
        return [];
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

    // Use Google Sheet queue data as primary source
    // Sort by priority (high first) then by queued time
    const queuedCalls = this.sortQueuedCalls(sheetQueuedCalls);

    return {
      metrics,
      callVolume,
      outcomes,
      recentActivity,
      queuedCalls,
      facebookLeads,
      lastUpdated: new Date().toISOString(),
    };
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

    // Convert n8n executions to activities (preferred source for detailed data)
    n8nExecutions.forEach(exec => {
      if (exec.data.phone) {
        const leadName = exec.data.firstName && exec.data.lastName
          ? `${exec.data.firstName} ${exec.data.lastName}`
          : exec.data.firstName || exec.data.lastName || 'Unknown';

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

        activities.push({
          id: exec.id,
          time: exec.startedAt,
          type: exec.data.callType || 'outbound',
          phone: exec.data.phone,
          leadName,
          outcome,
          leadScore: exec.data.leadScore,
          email: exec.data.email,
          callSummary: exec.data.callSummary,
        });
      }
    });

    // Convert VAPI calls to activities (if not already in n8n data)
    vapiCalls.forEach(call => {
      // Skip if we already have this call from n8n
      const exists = activities.find(a => a.phone === call.phoneNumber &&
        Math.abs(new Date(a.time).getTime() - new Date(call.startedAt).getTime()) < 60000);

      if (!exists) {
        const rawOutcome = (call.outcome || call.status || '').toLowerCase();
        const outcome: Activity['outcome'] = outcomeMap[rawOutcome] || 'other';

        activities.push({
          id: call.id,
          time: call.startedAt,
          type: call.type,
          phone: call.phoneNumber,
          leadName: call.leadName || 'Unknown',
          outcome,
        });
      }
    });

    // Sort by time (most recent first) and limit to 20
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 20);
  }

}

export const analyticsAggregator = new AnalyticsAggregator();
