'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import MetricsGrid from '@/components/dashboard/MetricsGrid';
import CallVolumeChart from '@/components/dashboard/CallVolumeChart';
import CallOutcomesChart from '@/components/dashboard/CallOutcomesChart';
import CallSummaryPanel from '@/components/dashboard/CallSummaryPanel';
import DetailedCallSummaries from '@/components/dashboard/DetailedCallSummaries';
import RecentActivityTable from '@/components/dashboard/RecentActivityTable';
import QueuedCallsPanel from '@/components/dashboard/QueuedCallsPanel';
import FacebookLeadsPanel from '@/components/dashboard/FacebookLeadsPanel';
import TodaysScheduleSidebar from '@/components/dashboard/TodaysScheduleSidebar';
import { DateRange } from '@/components/dashboard/DateRangeFilter';
import { ToastProvider, useToast } from '@/components/ui/ToastProvider';
import { exportActivityToCSV } from '@/lib/export-csv';
import type { DashboardData } from '@/types/analytics';
import type { GamificationData } from '@/types/gamification';
import { format } from 'date-fns';

function DashboardContent() {
  const [data, setData] = useState<{
    dashboard: DashboardData | null;
    gamification: GamificationData | null;
  }>({ dashboard: null, gamification: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>('today');
  const { showToast } = useToast();

  const fetchData = useCallback(async (isRefresh = false, dateRange?: DateRange) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }

      // Use provided dateRange or fall back to selected state
      const range = dateRange || selectedDateRange;
      const response = await fetch(`/api/analytics/dashboard?dateRange=${range}`);
      if (!response.ok) throw new Error('Failed to fetch data');

      const result = await response.json();
      setData({
        dashboard: result.dashboard,
        gamification: result.gamification,
      });
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  }, [selectedDateRange]);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // R key for refresh
      if (e.key === 'r' || e.key === 'R') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          const target = e.target as HTMLElement;
          // Don't trigger if user is typing in an input
          if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            handleRefresh();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleRefresh]);

  // Filter activities based on search query
  const filteredActivities = useMemo(() => {
    if (!data.dashboard?.recentActivity) return [];
    if (!searchQuery) return data.dashboard.recentActivity;

    const query = searchQuery.toLowerCase();
    return data.dashboard.recentActivity.filter(
      (activity) =>
        activity.leadName.toLowerCase().includes(query) ||
        activity.phone.includes(query) ||
        activity.email?.toLowerCase().includes(query)
    );
  }, [data.dashboard?.recentActivity, searchQuery]);

  // Filter Facebook leads based on search query
  const filteredFacebookLeads = useMemo(() => {
    if (!data.dashboard?.facebookLeads) return [];
    if (!searchQuery) return data.dashboard.facebookLeads;

    const query = searchQuery.toLowerCase();
    return data.dashboard.facebookLeads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(query) ||
        lead.phone?.includes(query) ||
        lead.email?.toLowerCase().includes(query)
    );
  }, [data.dashboard?.facebookLeads, searchQuery]);

  // Handle export
  const handleExport = useCallback(() => {
    if (!data.dashboard?.recentActivity) return;

    const filename = `active-wellness-calls-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    exportActivityToCSV(data.dashboard.recentActivity, filename);
    showToast('Data exported successfully', 'success');
  }, [data.dashboard?.recentActivity, showToast]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle date range change - triggers new API call with selected range
  const handleDateRangeChange = useCallback((range: DateRange) => {
    setSelectedDateRange(range);
    // Fetch data with new date range
    fetchData(true, range);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium tracking-wide">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data.dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Failed to load dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B44C45] via-[#B54E47] to-[#A34139] dark:from-wellness-900 dark:via-gray-950 dark:to-wellness-warning-900 relative overflow-hidden">
      {/* Premium ambient background effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0wIDNjLTEuNjU3IDAtMyAxLjM0My0zIDNzMS4zNDMgMyAzIDMgMy0xLjM0MyAzLTMtMS4zNDMtMy0zLTN6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none"></div>

      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-wellness-600 focus:text-white focus:rounded-lg focus:shadow-premium-lg"
      >
        Skip to main content
      </a>

      <div className="flex flex-col lg:flex-row min-h-screen relative z-10">
        {/* Main Content Area */}
        <main id="main-content" className="flex-1 min-w-0 order-2 lg:order-1 animate-fade-in">
          <div className="max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8">
            <DashboardHeader
              lastUpdated={lastUpdated}
              onRefresh={handleRefresh}
              onSearch={handleSearch}
              selectedDateRange={selectedDateRange}
              onDateRangeChange={handleDateRangeChange}
              onExport={handleExport}
            />

            <div className="space-y-6 mt-6 lg:mt-8">
              {/* Call Summary Panel */}
              <div className="stagger-item">
                <CallSummaryPanel
                  recentActivity={filteredActivities}
                  outcomes={data.dashboard.outcomes}
                  totalCalls={data.dashboard.metrics.totalCalls}
                  totalBookings={data.dashboard.metrics.totalBookings}
                  conversionRate={data.dashboard.metrics.conversionRate}
                  isRefreshing={refreshing}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="stagger-item">
                  <CallVolumeChart data={data.dashboard.callVolume} />
                </div>
                <div className="stagger-item">
                  <CallOutcomesChart data={data.dashboard.outcomes} />
                </div>
              </div>

              {/* Queued Calls Panel */}
              <div className="stagger-item">
                <QueuedCallsPanel queuedCalls={data.dashboard.queuedCalls} />
              </div>

              {/* Facebook Leads Panel */}
              <div className="stagger-item">
                <FacebookLeadsPanel facebookLeads={filteredFacebookLeads} />
              </div>

              {/* Detailed Call Summaries */}
              <div className="stagger-item">
                <DetailedCallSummaries activities={filteredActivities} />
              </div>

              <div className="stagger-item">
                <RecentActivityTable activities={filteredActivities} />
              </div>
            </div>
          </div>
        </main>

        {/* Today's Schedule Sidebar - responsive */}
        <aside className="w-full lg:w-96 order-1 lg:order-2">
          <TodaysScheduleSidebar
            queuedCalls={data.dashboard.queuedCalls}
            recentActivity={filteredActivities}
            facebookLeads={filteredFacebookLeads}
            totalCalls={data.dashboard.metrics.totalCalls}
            totalBookings={data.dashboard.metrics.totalBookings}
          />
        </aside>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}
