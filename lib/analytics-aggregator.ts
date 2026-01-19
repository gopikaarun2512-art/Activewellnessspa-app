import { n8nClient } from './n8n-client';
import { vapiClient } from './vapi-client';
import { facebookLeadsClient } from './facebook-leads-client';
import {
  DashboardData,
  DashboardMetrics,
  CallVolumeData,
  CallOutcome,
  Activity,
  QueuedCall,
  FacebookLead,
} from '@/types/analytics';
import { format } from 'date-fns';

export class AnalyticsAggregator {
  async getDashboardData(): Promise<DashboardData> {
    // Fetch data from all sources in parallel
    const [n8nExecutions, vapiCalls, queuedExecutions, facebookLeads] = await Promise.all([
      n8nClient.getTodaysCallData().catch(() => []),
      vapiClient.getTodaysCalls().catch(() => []),
      n8nClient.getQueuedCalls().catch(() => []),
      facebookLeadsClient.getTodaysLeads().catch(() => []),
    ]);

    // Combine and aggregate data
    const metrics = this.calculateMetrics(n8nExecutions, vapiCalls);
    const callVolume = this.calculateCallVolume(vapiCalls);
    const outcomes = this.calculateOutcomes(vapiCalls);
    const recentActivity = this.getRecentActivity(n8nExecutions, vapiCalls);
    const queuedCalls = this.getQueuedCalls(queuedExecutions);

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

  private calculateMetrics(n8nExecutions: any[], vapiCalls: any[]): DashboardMetrics {
    // Total calls from VAPI
    const totalCalls = vapiCalls.length;

    // Bookings from both sources
    const n8nBookings = n8nExecutions.filter(e => e.data.booked === true).length;
    const vapiBookings = vapiCalls.filter(c =>
      c.outcome?.toLowerCase().includes('book') ||
      c.status === 'completed' && c.duration > 60 // Assuming longer calls might be bookings
    ).length;
    const totalBookings = Math.max(n8nBookings, vapiBookings); // Use the higher count

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

  private calculateOutcomes(vapiCalls: any[]): CallOutcome[] {
    const outcomeCounts = {
      booked: 0,
      noAnswer: 0,
      voicemail: 0,
      notInterested: 0,
      other: 0,
    };

    vapiCalls.forEach(call => {
      const outcome = call.outcome?.toLowerCase() || call.status;

      if (outcome.includes('book')) {
        outcomeCounts.booked++;
      } else if (outcome.includes('no-answer') || outcome.includes('no answer')) {
        outcomeCounts.noAnswer++;
      } else if (outcome.includes('voicemail')) {
        outcomeCounts.voicemail++;
      } else if (outcome.includes('not interested') || outcome.includes('declined')) {
        outcomeCounts.notInterested++;
      } else {
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

    // Convert n8n executions to activities (preferred source for detailed data)
    n8nExecutions.forEach(exec => {
      if (exec.data.phone) {
        const outcomeMap: Record<string, Activity['outcome']> = {
          'booked': 'booked',
          'no-answer': 'noAnswer',
          'no_answer': 'noAnswer',
          'voicemail': 'voicemail',
          'not-interested': 'notInterested',
          'not_interested': 'notInterested',
        };

        const leadName = exec.data.firstName && exec.data.lastName
          ? `${exec.data.firstName} ${exec.data.lastName}`
          : exec.data.firstName || exec.data.lastName || 'Unknown';

        activities.push({
          id: exec.id,
          time: exec.startedAt,
          type: exec.data.callType || 'outbound',
          phone: exec.data.phone,
          leadName,
          outcome: outcomeMap[exec.data.outcome] || (exec.data.booked ? 'booked' : 'other'),
          leadScore: exec.data.leadScore,
          email: exec.data.email,
          linkSent: exec.data.linkSent,
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
        const outcomeMap: Record<string, Activity['outcome']> = {
          'completed': 'booked',
          'no-answer': 'noAnswer',
          'voicemail': 'voicemail',
          'failed': 'other',
        };

        activities.push({
          id: call.id,
          time: call.startedAt,
          type: call.type,
          phone: call.phoneNumber,
          leadName: call.leadName || 'Unknown',
          outcome: outcomeMap[call.status] || 'other',
        });
      }
    });

    // Sort by time (most recent first) and limit to 20
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 20);
  }

  private getQueuedCalls(queuedExecutions: any[]): QueuedCall[] {
    const queuedCalls: QueuedCall[] = [];

    queuedExecutions.forEach(execution => {
      // Determine call type from workflow name or data
      let callType: 'inbound' | 'outbound' = 'outbound';
      if (execution.workflowName?.toLowerCase().includes('inbound')) {
        callType = 'inbound';
      }
      if (execution.data.callType) {
        callType = execution.data.callType;
      }

      // Build lead name
      let leadName = 'Unknown';
      if (execution.data.firstName || execution.data.lastName) {
        leadName = `${execution.data.firstName || ''} ${execution.data.lastName || ''}`.trim();
      }

      queuedCalls.push({
        id: execution.id,
        phone: execution.data.phone || 'N/A',
        leadName,
        type: callType,
        queuedAt: execution.startedAt,
        priority: 'medium', // Default priority
        workflowName: execution.workflowName,
      });
    });

    // Sort by queued time (earliest first)
    return queuedCalls.sort((a, b) =>
      new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime()
    );
  }
}

export const analyticsAggregator = new AnalyticsAggregator();
