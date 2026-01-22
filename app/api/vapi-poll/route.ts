import { NextResponse } from 'next/server';
import { vapiClient } from '@/lib/vapi-client';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to poll for new VAPI calls
 * Used by the dashboard to detect when calls are scheduled/completed
 *
 * Query params:
 * - lastCallId: The ID of the last known call (optional)
 * - lastCount: The last known call count (optional)
 *
 * Returns:
 * - count: Current call count for today
 * - latestCallId: ID of the most recent call
 * - latestCallTime: Time of the most recent call
 * - hasNewCalls: Whether new calls were detected since last check
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lastCallId = searchParams.get('lastCallId');
    const lastCount = parseInt(searchParams.get('lastCount') || '0', 10);

    const current = await vapiClient.getTodaysCallCount();

    // Determine if there are new calls
    let hasNewCalls = false;
    if (current.count > lastCount) {
      hasNewCalls = true;
    } else if (lastCallId && current.latestCallId && current.latestCallId !== lastCallId) {
      hasNewCalls = true;
    }

    return NextResponse.json({
      count: current.count,
      latestCallId: current.latestCallId,
      latestCallTime: current.latestCallTime,
      hasNewCalls,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[VAPI Poll] Error:', error);
    return NextResponse.json({
      error: error.message,
      count: 0,
      latestCallId: null,
      latestCallTime: null,
      hasNewCalls: false,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
