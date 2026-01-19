'use client';

import { QueuedCall } from '@/types/analytics';
import { format } from 'date-fns';

interface QueuedCallsPanelProps {
  queuedCalls: QueuedCall[];
}

export default function QueuedCallsPanel({ queuedCalls }: QueuedCallsPanelProps) {
  // Priority colors (using Active Wellness theme)
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
          ↓ Inbound
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-700">
        ↑ Outbound
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-wellness-neutral-300/30 dark:border-wellness-700/30 shadow-premium-lg hover-lift backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-wellness-neutral-300 dark:border-wellness-700 bg-gradient-to-r from-[#B44C45] via-[#D4A59A] to-[#ECE3DC] dark:from-wellness-900 dark:via-wellness-700 dark:to-wellness-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-wellness-900 dark:bg-wellness-600 flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white dark:text-wellness-neutral-100">
              Call Queue
            </h2>
            <p className="text-sm text-white/90 dark:text-wellness-neutral-300">
              {queuedCalls.length} {queuedCalls.length === 1 ? 'call' : 'calls'} in progress
            </p>
          </div>
          {queuedCalls.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-wellness-900 text-white rounded-full text-sm font-medium shadow-sm">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Active
            </div>
          )}
        </div>
      </div>

      {/* Queue List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {queuedCalls.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="max-w-sm mx-auto">
              {/* Enhanced checkmark illustration */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 animate-pulse"></div>
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                All Caught Up!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                No calls in the queue right now. All pending calls have been completed.
              </p>

              {/* Info box */}
              <div className="bg-green-50/50 dark:bg-green-900/10 rounded-lg p-4 border border-green-200/30 dark:border-green-700/20">
                <div className="flex items-start gap-3 text-left">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    New scheduled calls and follow-ups will appear here automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          queuedCalls.slice(0, 10).map((call, index) => (
            <div
              key={call.id}
              className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
            >
              <div className="flex items-start gap-4">
                {/* Queue Position */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-teal-700 dark:text-teal-300">
                      {index + 1}
                    </span>
                  </div>
                </div>

                {/* Call Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {call.leadName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                        {call.phone}
                      </p>
                    </div>
                    {getTypeBadge(call.type)}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Queued {format(new Date(call.queuedAt), 'h:mm a')}
                    </span>
                    {call.workflowName && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                        <span className="truncate max-w-[200px]" title={call.workflowName}>
                          {call.workflowName}
                        </span>
                      </>
                    )}
                  </div>

                  {call.priority && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(call.priority)}`}>
                        {call.priority.charAt(0).toUpperCase() + call.priority.slice(1)} Priority
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Indicator */}
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-2 h-2">
                    <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" title="In progress" />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer - Show More */}
      {queuedCalls.length > 10 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-center text-gray-600 dark:text-gray-300">
            Showing 10 of {queuedCalls.length} queued calls
          </p>
        </div>
      )}
    </div>
  );
}
