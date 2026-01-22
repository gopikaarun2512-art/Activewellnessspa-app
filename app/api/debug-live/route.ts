import { NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n-client';
import { vapiClient } from '@/lib/vapi-client';
import { facebookLeadsClient } from '@/lib/facebook-leads-client';
import { queueClient } from '@/lib/queue-client';
import { getNowInAWST } from '@/lib/timezone';

export const dynamic = 'force-dynamic';

/**
 * Comprehensive debug endpoint to test all data sources
 * Access at: /api/debug-live
 */
export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    awstTime: getNowInAWST().toISOString(),
    sources: {},
    errors: [],
  };

  // Get date range for today using AWST midnight-to-midnight (same as dashboard)
  const now = new Date();

  // Get current date in AWST using Intl API
  const awstFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Perth',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const awstDateStr = awstFormatter.format(now); // YYYY-MM-DD in AWST
  const [year, month, day] = awstDateStr.split('-').map(Number);

  // AWST midnight = UTC 16:00 previous day (midnight - 8 hours = 16:00 UTC previous day)
  const startOfDay = new Date(Date.UTC(year, month - 1, day - 1, 16, 0, 0, 0));
  const endOfDay = now; // Current time as end

  results.dateRange = {
    awstDate: awstDateStr,
    startOfDayUTC: startOfDay.toISOString(),
    startOfDayAWST: startOfDay.toLocaleString('en-AU', { timeZone: 'Australia/Perth' }),
    endOfDayUTC: endOfDay.toISOString(),
    endOfDayAWST: endOfDay.toLocaleString('en-AU', { timeZone: 'Australia/Perth' }),
  };

  // 1. Test Google Sheets Queue
  try {
    const sheetQueue = await queueClient.getQueueFromGoogleSheets();
    results.sources.googleSheets = {
      success: true,
      totalRows: sheetQueue.length,
      sample: sheetQueue.slice(0, 3).map(row => ({
        id: row.id,
        leadName: row.leadName,
        phone: row.phone,
        status: (row as any).status,
        priority: row.priority,
        queuedAt: row.queuedAt,
        callOutcome: (row as any).callOutcome,
      })),
    };
  } catch (error: any) {
    results.sources.googleSheets = { success: false, error: error.message };
    results.errors.push(`Google Sheets: ${error.message}`);
  }

  // 2. Test n8n Webhook Queue
  try {
    const webhookQueue = await queueClient.getQueueFromWebhook();
    results.sources.n8nWebhookQueue = {
      success: true,
      totalRows: webhookQueue.length,
      sample: webhookQueue.slice(0, 3).map(row => ({
        id: row.id,
        leadName: row.leadName,
        phone: row.phone,
        status: (row as any).status,
        priority: row.priority,
        queuedAt: row.queuedAt,
        callOutcome: (row as any).callOutcome,
      })),
    };
  } catch (error: any) {
    results.sources.n8nWebhookQueue = { success: false, error: error.message };
    results.errors.push(`n8n Webhook Queue: ${error.message}`);
  }

  // 3. Test filtered queued calls (what dashboard uses)
  try {
    const queuedCalls = await queueClient.getQueuedCalls();
    results.sources.filteredQueue = {
      success: true,
      totalCalls: queuedCalls.length,
      sample: queuedCalls.slice(0, 3),
    };
  } catch (error: any) {
    results.sources.filteredQueue = { success: false, error: error.message };
    results.errors.push(`Filtered Queue: ${error.message}`);
  }

  // 4. Test n8n Executions API
  try {
    const executions = await n8nClient.getCallData(startOfDay, endOfDay);
    results.sources.n8nExecutions = {
      success: true,
      totalExecutions: executions.length,
      sample: executions.slice(0, 3).map(exec => ({
        id: exec.id,
        workflowId: exec.workflowId,
        workflowName: exec.workflowName,
        status: exec.status,
        startedAt: exec.startedAt,
        data: {
          phone: exec.data.phone,
          firstName: exec.data.firstName,
          lastName: exec.data.lastName,
          outcome: exec.data.outcome,
          callSummary: exec.data.callSummary ? exec.data.callSummary.substring(0, 100) + '...' : null,
          isBooked: exec.data.isBooked,
          leadScore: exec.data.leadScore,
        },
      })),
    };
  } catch (error: any) {
    results.sources.n8nExecutions = { success: false, error: error.message };
    results.errors.push(`n8n Executions: ${error.message}`);
  }

  // 5. Test VAPI Calls API
  try {
    const vapiCalls = await vapiClient.getCalls(startOfDay, endOfDay);
    results.sources.vapiCalls = {
      success: true,
      totalCalls: vapiCalls.length,
      sample: vapiCalls.slice(0, 3).map(call => ({
        id: call.id,
        type: call.type,
        phoneNumber: call.phoneNumber,
        status: call.status,
        outcome: call.outcome,
        startedAt: call.startedAt,
        duration: call.duration,
        leadName: call.leadName,
        summary: call.summary ? call.summary.substring(0, 100) + '...' : null,
      })),
    };
  } catch (error: any) {
    results.sources.vapiCalls = { success: false, error: error.message };
    results.errors.push(`VAPI Calls: ${error.message}`);
  }

  // 6. Test Facebook Leads
  try {
    const fbLeads = await facebookLeadsClient.getLeads(startOfDay, endOfDay);
    results.sources.facebookLeads = {
      success: true,
      totalLeads: fbLeads.length,
      sample: fbLeads.slice(0, 3).map(lead => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        status: lead.status,
        source: lead.source,
        createdTime: lead.createdTime,
      })),
    };
  } catch (error: any) {
    results.sources.facebookLeads = { success: false, error: error.message };
    results.errors.push(`Facebook Leads: ${error.message}`);
  }

  // Summary
  results.summary = {
    successfulSources: Object.values(results.sources).filter((s: any) => s.success).length,
    failedSources: Object.values(results.sources).filter((s: any) => !s.success).length,
    totalErrors: results.errors.length,
  };

  return NextResponse.json(results, { status: 200 });
}
