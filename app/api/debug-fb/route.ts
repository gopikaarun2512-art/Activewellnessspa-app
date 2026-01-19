import { NextResponse } from 'next/server';

const N8N_API_URL = process.env.N8N_API_URL || '';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

export async function GET() {
  try {
    const facebookWorkflowId = 'Gz4UxfzFByeh04nv';
    const url = `${N8N_API_URL}/executions?workflowId=${facebookWorkflowId}&limit=5`;

    console.log('Fetching from:', url);

    const response = await fetch(url, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json({
        error: `HTTP ${response.status}: ${response.statusText}`,
        body: text,
        url,
      }, { status: 500 });
    }

    const data = JSON.parse(text);

    return NextResponse.json({
      url,
      status: response.status,
      dataCount: data.data?.length || 0,
      executions: data.data?.map((e: any) => ({
        id: e.id,
        workflowId: e.workflowId,
        status: e.status,
        startedAt: e.startedAt,
        hasResultData: !!e.data?.resultData,
        runDataKeys: e.data?.resultData?.runData ? Object.keys(e.data.resultData.runData) : [],
      })) || [],
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
