import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY || '';

export async function GET() {
  try {
    if (!VAPI_PRIVATE_KEY) {
      return NextResponse.json({ error: 'VAPI_PRIVATE_KEY not configured' }, { status: 500 });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch calls directly from VAPI
    const response = await fetch(
      `https://api.vapi.ai/call?createdAtGt=${today.toISOString()}&createdAtLt=${tomorrow.toISOString()}&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `VAPI API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const calls = await response.json();

    // Return raw VAPI data with summary-relevant fields highlighted
    const debugData = (calls || []).slice(0, 3).map((call: any) => ({
      id: call.id,
      status: call.status,
      endedReason: call.endedReason,
      customer: {
        number: call.customer?.number,
        name: call.customer?.name,
      },
      startedAt: call.startedAt,
      endedAt: call.endedAt,

      // Summary-related fields
      summary: call.summary || null,

      artifact: call.artifact ? {
        summary: call.artifact.summary || null,
        analysisKeys: call.artifact.analysis ? Object.keys(call.artifact.analysis) : [],
        analysisSummary: call.artifact.analysis?.summary || null,
        messagesCount: call.artifact.messages?.length || 0,
        transcriptLength: call.artifact.transcript?.length || 0,
        structuredOutputsKeys: call.artifact.structuredOutputs ? Object.keys(call.artifact.structuredOutputs) : [],
        // Show first structured output for debugging
        structuredOutputsSample: call.artifact.structuredOutputs
          ? Object.entries(call.artifact.structuredOutputs).slice(0, 2).map(([key, val]: [string, any]) => ({
              key,
              result: val?.result,
            }))
          : [],
      } : null,

      analysis: call.analysis ? {
        summary: call.analysis.summary || null,
        structuredDataKeys: call.analysis.structuredData ? Object.keys(call.analysis.structuredData) : [],
        structuredDataSummary: call.analysis.structuredData?.summary || null,
        structuredDataConversationSummary: call.analysis.structuredData?.conversation_summary || null,
      } : null,
    }));

    return NextResponse.json({
      totalCalls: calls?.length || 0,
      dateRange: {
        from: today.toISOString(),
        to: tomorrow.toISOString(),
      },
      sampleCalls: debugData,
    });
  } catch (error) {
    console.error('Debug VAPI error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
