'use client';

import { format } from 'date-fns';
import SearchBar from './SearchBar';
import DateRangeFilter, { DateRange } from './DateRangeFilter';

interface DashboardHeaderProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  onSearch?: (query: string) => void;
  selectedDateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  onExport?: () => void;
}

export default function DashboardHeader({
  lastUpdated,
  onRefresh,
  onSearch,
  selectedDateRange = 'today',
  onDateRangeChange,
  onExport,
}: DashboardHeaderProps) {
  return (
    <div className="space-y-6 mb-8">
      {/* Top Row: Title and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white dark:text-white tracking-tight drop-shadow-lg">
            Active Wellness
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <p className="text-lg text-white/95 dark:text-gray-400 font-medium">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
            {lastUpdated && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 dark:bg-gray-700" />
                <p className="text-sm text-white/85 dark:text-gray-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  Updated {format(lastUpdated, 'h:mm a')}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onExport && (
            <button
              onClick={onExport}
              aria-label="Export data to CSV"
              className="group flex items-center gap-2 px-5 py-3 bg-white/20 dark:bg-gray-900 border border-white/40 dark:border-gray-700 rounded-xl hover:bg-white/30 hover:shadow-premium-lg hover:scale-105 dark:hover:border-wellness-600 dark:hover:bg-wellness-900/10 transition-all duration-300 backdrop-blur-md"
            >
              <svg
                className="w-5 h-5 text-white dark:text-gray-300 group-hover:scale-110 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-sm font-semibold text-white dark:text-gray-300 tracking-wide">
                Export
              </span>
            </button>
          )}

          <button
            onClick={onRefresh}
            aria-label="Refresh dashboard data"
            className="group flex items-center gap-2 px-5 py-3 bg-white/20 dark:bg-gray-900 border border-white/40 dark:border-gray-700 rounded-xl hover:bg-white/30 hover:shadow-premium-lg hover:scale-105 dark:hover:border-wellness-600 dark:hover:bg-wellness-900/10 transition-all duration-300 backdrop-blur-md"
          >
            <svg
              className="w-5 h-5 text-white dark:text-gray-300 group-hover:rotate-180 group-hover:scale-110 transition-all duration-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="text-sm font-semibold text-white dark:text-gray-300 tracking-wide">
              Refresh
            </span>
          </button>
        </div>
      </div>

      {/* Second Row: Search and Date Filter */}
      {(onSearch || onDateRangeChange) && (
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white/10 dark:bg-gray-900/30 backdrop-blur-md rounded-2xl p-4 border border-white/20 dark:border-gray-700/30 shadow-premium">
          {onSearch && (
            <SearchBar
              onSearch={onSearch}
              className="w-full lg:flex-1"
            />
          )}

          {onDateRangeChange && (
            <DateRangeFilter
              selectedRange={selectedDateRange}
              onRangeChange={onDateRangeChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
