import { NextResponse } from 'next/server';
import { analyticsAggregator } from '@/lib/analytics-aggregator';
import { queueClient } from '@/lib/queue-client';
import { gamificationCalculator } from '@/lib/gamification';
import { getNowInAWST, formatInAWST } from '@/lib/timezone';

// Force dynamic rendering on Vercel (required for external API calls)
export const dynamic = 'force-dynamic';

// Cache the data for 1 minute to reduce API calls
// Cache is keyed by date range
const cacheStore: Map<string, { data: any; time: number }> = new Map();
const CACHE_DURATION = 60 * 1000; // 1 minute

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'today';
    const forceRefresh = searchParams.get('refresh') === 'true';
    const now = Date.now();

    // Create cache key based on date range
    const cacheKey = `dashboard-${dateRange}`;
    const cached = cacheStore.get(cacheKey);

    // Clear cache if force refresh requested
    if (forceRefresh) {
      cacheStore.delete(cacheKey);
    }

    // Return cached data if still fresh (unless force refresh)
    if (!forceRefresh && cached && (now - cached.time) < CACHE_DURATION) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cacheAge: Math.floor((now - cached.time) / 1000),
      });
    }

    // Fetch fresh data with date range
    const dashboardData = await analyticsAggregator.getDashboardData(dateRange);

    // Calculate gamification data
    // In a real app, you'd fetch total calls from a database
    // For now, using today's calls as a proxy
    const gamificationData = gamificationCalculator.calculateGamificationData(
      dashboardData,
      dashboardData.metrics.totalCalls // This should be total all-time calls
    );

    const nowAWST = getNowInAWST();
    const response = {
      dashboard: dashboardData,
      gamification: gamificationData,
      timestamp: new Date().toISOString(),
      awstTime: formatInAWST(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      dailyResetTime: '12:00 PM AWST',
      nextResetHour: nowAWST.getHours() >= 12 ? 'Tomorrow 12:00 PM AWST' : 'Today 12:00 PM AWST',
      apiVersion: '0.1.6-logging',
      debug: {
        webhookFetchStatus: queueClient.lastFetchStatus,
        analyticsDebug: (analyticsAggregator as any).debugInfo,
        queuedCallsCount: dashboardData.queuedCalls.length,
        firstQueuedCall: dashboardData.queuedCalls[0] ? {
          name: dashboardData.queuedCalls[0].leadName,
          priority: dashboardData.queuedCalls[0].priority,
          source: dashboardData.queuedCalls[0].workflowName,
          phone: dashboardData.queuedCalls[0].phone,
          scheduledTime: dashboardData.queuedCalls[0].estimatedCallTime,
          idPrefix: dashboardData.queuedCalls[0].id.substring(0, 10),
        } : null,
      },
    };

    // Update cache with date range key
    cacheStore.set(cacheKey, { data: response, time: now });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
