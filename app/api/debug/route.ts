import { NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n-client';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let executionsRaw = [];
    let executionsFiltered = [];
    let workflowsCount = 0;
    let sampleWorkflowNames: string[] = [];
    let error = null;

    try {
      // Get executions before filtering
      const execs = await n8nClient.listExecutions({
        status: 'success',
        startedAfter: today.toISOString(),
        limit: 10,
      });
      executionsRaw = execs;

      // Get filtered call data
      const callData = await n8nClient.getTodaysCallData();
      executionsFiltered = callData;

      // Get workflow names
      const workflows = await n8nClient.listWorkflows();
      workflowsCount = workflows.length;
      sampleWorkflowNames = workflows.slice(0, 5).map((w: any) => w.name);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
    }

    return NextResponse.json({
      env: {
        N8N_API_URL: process.env.N8N_API_URL || 'NOT SET',
        N8N_API_KEY: process.env.N8N_API_KEY ? 'SET (length: ' + process.env.N8N_API_KEY.length + ')' : 'NOT SET',
      },
      n8nTest: {
        todayStart: today.toISOString(),
        executionsRaw: executionsRaw.length,
        executionsFiltered: executionsFiltered.length,
        workflowsCount,
        sampleWorkflowNames,
        sampleExecutions: executionsRaw.slice(0, 3).map((e: any) => ({
          id: e.id,
          workflowId: e.workflowId,
          workflowName: e.workflowName,
        })),
        error,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : 'Unknown error',
      stack: e instanceof Error ? e.stack : undefined,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
