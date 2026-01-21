'use client';

import { ScheduledCallback } from '@/types/analytics';
import { formatShortTimeAWST, formatDateTimeShortAWST } from '@/lib/timezone';

interface ScheduledCallbacksPanelProps {
  callbacks: ScheduledCallback[];
}

export default function ScheduledCallbacksPanel({ callbacks }: ScheduledCallbacksPanelProps) {
  const getPriorityColor = (priority: string = 'medium') => {
    const colors = {
      high: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      medium: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      low: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getTypeBadge = (type: 'inbound' | 'outbound') => {
    if (type === 'inbound') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
          Inbound
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-700">
        Outbound
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-wellness-neutral-300/30 dark:border-wellness-700/30 shadow-premium-lg hover-lift backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-wellness-neutral-300 dark:border-wellness-700 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 dark:from-purple-900 dark:via-purple-700 dark:to-purple-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">
              Scheduled Callbacks
            </h2>
            <p className="text-sm text-white/90">
              {callbacks.length} {callbacks.length === 1 ? 'callback' : 'callbacks'} scheduled
            </p>
          </div>
          {callbacks.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 text-white rounded-full text-sm font-medium shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pending
            </div>
          )}
        </div>
      </div>

      {/* Callbacks List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {callbacks.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="max-w-sm mx-auto">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30"></div>
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                No Callbacks Scheduled
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                When leads request callbacks, they'll appear here with their scheduled times.
              </p>
            </div>
          </div>
        ) : (
          callbacks.slice(0, 10).map((callback, index) => (
            <div
              key={callback.id}
              className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Position indicator */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                      {index + 1}
                    </span>
                  </div>
                </div>

                {/* Callback Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {callback.leadName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                        {callback.phone}
                      </p>
                    </div>
                    {getTypeBadge(callback.type)}
                  </div>

                  {/* Scheduled time and reason */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Scheduled: {formatDateTimeShortAWST(callback.scheduledAt)}
                    </span>
                  </div>

                  {/* Callback reason */}
                  {callback.callbackReason && (
                    <div className="flex items-start gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        {callback.callbackReason}
                      </span>
                    </div>
                  )}

                  {callback.priority && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(callback.priority)}`}>
                        {callback.priority.charAt(0).toUpperCase() + callback.priority.slice(1)} Priority
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Indicator */}
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-2 h-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" title="Scheduled" />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer - Show More */}
      {callbacks.length > 10 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-center text-gray-600 dark:text-gray-300">
            Showing 10 of {callbacks.length} scheduled callbacks
          </p>
        </div>
      )}
    </div>
  );
}
