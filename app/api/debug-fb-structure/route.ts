import { NextResponse } from 'next/server';

const N8N_API_URL = process.env.N8N_API_URL || '';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

export async function GET() {
  try {
    const executionId = '15457'; // Latest execution
    const url = `${N8N_API_URL}/executions/${executionId}?includeData=true`;

    const response = await fetch(url, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({
        error: `HTTP ${response.status}: ${response.statusText}`,
        body: text,
      }, { status: 500 });
    }

    const execution = await response.json();
    const runData = execution.data?.resultData?.runData || {};

    // Extract sample data from each node
    const nodeData: any = {};
    Object.keys(runData).forEach(nodeKey => {
      const nodeRuns = runData[nodeKey];
      if (Array.isArray(nodeRuns) && nodeRuns[0]?.data?.main?.[0]?.[0]?.json) {
        nodeData[nodeKey] = nodeRuns[0].data.main[0][0].json;
      }
    });

    return NextResponse.json({
      executionId,
      nodeNames: Object.keys(runData),
      leadDetailsNode: nodeData['Get Lead Details'] || null,
      normalizeNode: nodeData['Normalize Lead Data (Phone + Attribution)'] || null,
      webhookNode: nodeData['Webhook'] || null,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
