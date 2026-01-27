'use client';

import { useState, useEffect } from 'react';
import { QueuedCall } from '@/types/analytics';
import { formatShortTimeAWST } from '@/lib/timezone';

interface QueuedCallsPanelProps {
  queuedCalls: QueuedCall[];
  onClearQueue?: () => void;
}

export default function QueuedCallsPanel({ queuedCalls, onClearQueue }: QueuedCallsPanelProps) {
  const [isQueueHidden, setIsQueueHidden] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Check localStorage for hidden state on mount
  useEffect(() => {
    const hiddenUntil = localStorage.getItem('queueHiddenUntil');
    if (hiddenUntil) {
      const hiddenTime = new Date(hiddenUntil);
      if (hiddenTime > new Date()) {
        setIsQueueHidden(true);
      } else {
        localStorage.removeItem('queueHiddenUntil');
      }
    }
  }, []);

  const handleClearQueue = () => {
    // Hide queue for 1 hour
    const hideUntil = new Date(Date.now() + 60 * 60 * 1000);
    localStorage.setItem('queueHiddenUntil', hideUntil.toISOString());
    setIsQueueHidden(true);
    setShowConfirm(false);
    onClearQueue?.();
  };

  const handleRestoreQueue = () => {
    localStorage.removeItem('queueHiddenUntil');
    setIsQueueHidden(false);
  };

  // If queue is hidden, show empty state
  const displayedCalls = isQueueHidden ? [] : queuedCalls;
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
              {isQueueHidden ? '0 calls (cleared)' : `${displayedCalls.length} ${displayedCalls.length === 1 ? 'call' : 'calls'} in progress`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Clear/Restore Queue Button */}
            {isQueueHidden ? (
              <button
                onClick={handleRestoreQueue}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full text-xs font-medium transition-colors"
                title="Restore queue display"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Restore
              </button>
            ) : queuedCalls.length > 0 && (
              showConfirm ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearQueue}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-medium transition-colors"
                  >
                    Confirm Clear
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full text-xs font-medium transition-colors"
                  title="Clear queue display (hides for 1 hour)"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear
                </button>
              )
            )}
            {displayedCalls.length > 0 && !isQueueHidden && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-wellness-900 text-white rounded-full text-sm font-medium shadow-sm">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Active
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {displayedCalls.length === 0 ? (
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
          displayedCalls.slice(0, 10).map((call, index) => (
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

                  <div className="flex items-center flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Queued {formatShortTimeAWST(call.queuedAt)}
                    </span>
                    {call.estimatedCallTime && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Scheduled {formatShortTimeAWST(call.estimatedCallTime)}
                        </span>
                      </>
                    )}
                    {call.workflowName && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                        <span className="truncate max-w-[200px]" title={call.workflowName}>
                          {call.workflowName}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Always show priority tag */}
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(call.priority || 'medium')}`}>
                      {(call.priority || 'medium').charAt(0).toUpperCase() + (call.priority || 'medium').slice(1)} Priority
                    </span>
                  </div>
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
      {displayedCalls.length > 10 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-center text-gray-600 dark:text-gray-300">
            Showing 10 of {displayedCalls.length} queued calls
          </p>
        </div>
      )}

      {/* Hidden notice */}
      {isQueueHidden && queuedCalls.length > 0 && (
        <div className="px-6 py-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-700">
          <p className="text-sm text-center text-amber-700 dark:text-amber-300">
            Queue display cleared. {queuedCalls.length} items hidden. Click "Restore" to show again.
          </p>
        </div>
      )}
    </div>
  );
}
