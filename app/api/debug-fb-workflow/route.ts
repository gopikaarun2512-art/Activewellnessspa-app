import { NextResponse } from 'next/server';

const N8N_API_URL = process.env.N8N_API_URL || '';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to check Facebook leads workflows
 * Tests multiple potential workflow IDs to find the correct one
 * Access at: /api/debug-fb-workflow
 */
export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    n8nApiUrl: N8N_API_URL ? 'configured' : 'NOT CONFIGURED',
    apiKeyPresent: !!N8N_API_KEY,
    workflows: {},
    allWorkflows: [],
  };

  // Known workflow IDs to test
  const workflowIds = [
    { id: '9gbmNOvmObqSIe8u', name: 'Facebook Lead Capture (current in code)' },
    { id: 'Gz4UxfzFByeh04nv', name: 'Facebook workflow (from debug-fb)' },
  ];

  // Test each workflow ID
  for (const workflow of workflowIds) {
    try {
      const url = `${N8N_API_URL}/executions?workflowId=${workflow.id}&limit=5`;
      const response = await fetch(url, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Accept': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        results.workflows[workflow.id] = {
          name: workflow.name,
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
        continue;
      }

      const data = await response.json();
      const executions = data.data || [];

      results.workflows[workflow.id] = {
        name: workflow.name,
        success: true,
        executionCount: executions.length,
        executions: executions.map((e: any) => ({
          id: e.id,
          status: e.status,
          startedAt: e.startedAt,
          workflowName: e.workflowName,
        })),
      };
    } catch (error: any) {
      results.workflows[workflow.id] = {
        name: workflow.name,
        success: false,
        error: error.message,
      };
    }
  }

  // Also list all workflows to find potential Facebook workflows
  try {
    const response = await fetch(`${N8N_API_URL}/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      const workflows = data.data || [];

      // Filter for potentially Facebook-related workflows
      const facebookWorkflows = workflows.filter((w: any) =>
        w.name?.toLowerCase().includes('facebook') ||
        w.name?.toLowerCase().includes('fb') ||
        w.name?.toLowerCase().includes('lead')
      );

      results.allWorkflows = facebookWorkflows.map((w: any) => ({
        id: w.id,
        name: w.name,
        active: w.active,
      }));

      results.totalWorkflows = workflows.length;
      results.facebookRelatedCount = facebookWorkflows.length;
    }
  } catch (error: any) {
    results.workflowsListError = error.message;
  }

  return NextResponse.json(results, { status: 200 });
}
