import { NextResponse } from 'next/server';

const N8N_API_URL = process.env.N8N_API_URL || '';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

export async function GET() {
  try {
    const executionId = '15453'; // User's submitted lead
    const url = `${N8N_API_URL}/executions/${executionId}`;

    console.log('Fetching from:', url);

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

    // Show full raw response (first 500 chars of each key)
    const summary: any = {
      keys: Object.keys(execution),
      id: execution.id,
      status: execution.status,
      startedAt: execution.startedAt,
      finishedAt: execution.finishedAt,
      dataKeys: execution.data ? Object.keys(execution.data) : [],
      rawExecution: JSON.stringify(execution).substring(0, 2000),
    };

    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
