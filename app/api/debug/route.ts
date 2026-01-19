import { NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n-client';

export async function GET() {
  try {
    // Test n8n API connection
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let executionsCount = 0;
    let workflowsCount = 0;
    let error = null;

    try {
      const executions = await n8nClient.listExecutions({
        status: 'success',
        startedAfter: today.toISOString(),
        limit: 10,
      });
      executionsCount = executions.length;

      const workflows = await n8nClient.listWorkflows();
      workflowsCount = workflows.length;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
    }

    return NextResponse.json({
      env: {
        N8N_API_URL: process.env.N8N_API_URL || 'NOT SET',
        N8N_API_KEY: process.env.N8N_API_KEY ? 'SET (length: ' + process.env.N8N_API_KEY.length + ')' : 'NOT SET',
        GHL_API_KEY: process.env.GHL_API_KEY ? 'SET' : 'NOT SET',
        VAPI_API_KEY: process.env.VAPI_API_KEY ? 'SET' : 'NOT SET',
      },
      n8nTest: {
        todayStart: today.toISOString(),
        executionsFound: executionsCount,
        workflowsFound: workflowsCount,
        error,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
