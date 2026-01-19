import { NextResponse } from 'next/server';
import { analyticsAggregator } from '@/lib/analytics-aggregator';
import { gamificationCalculator } from '@/lib/gamification';

// Force dynamic rendering on Vercel (required for external API calls)
export const dynamic = 'force-dynamic';

// Cache the data for 1 minute to reduce API calls
let cachedData: any = null;
let cacheTime: number = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute

export async function GET() {
  try {
    const now = Date.now();

    // Return cached data if still fresh
    if (cachedData && (now - cacheTime) < CACHE_DURATION) {
      return NextResponse.json({
        ...cachedData,
        cached: true,
        cacheAge: Math.floor((now - cacheTime) / 1000),
      });
    }

    // Fetch fresh data
    const dashboardData = await analyticsAggregator.getDashboardData();

    // Calculate gamification data
    // In a real app, you'd fetch total calls from a database
    // For now, using today's calls as a proxy
    const gamificationData = gamificationCalculator.calculateGamificationData(
      dashboardData,
      dashboardData.metrics.totalCalls // This should be total all-time calls
    );

    const response = {
      dashboard: dashboardData,
      gamification: gamificationData,
      timestamp: new Date().toISOString(),
    };

    // Update cache
    cachedData = response;
    cacheTime = now;

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
