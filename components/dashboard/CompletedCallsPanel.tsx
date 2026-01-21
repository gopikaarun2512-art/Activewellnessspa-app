'use client';

import { CompletedCall } from '@/types/analytics';
import { formatShortTimeAWST, formatDateTimeShortAWST } from '@/lib/timezone';

interface CompletedCallsPanelProps {
  calls: CompletedCall[];
}

export default function CompletedCallsPanel({ calls }: CompletedCallsPanelProps) {
  const getOutcomeBadge = (outcome: string) => {
    const normalizedOutcome = outcome.toLowerCase();

    const styles: Record<string, string> = {
      booked: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      booking_link_sent: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      linksent: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      no_answer: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      noanswer: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      voicemail: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      not_interested: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      notinterested: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      busy: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      wrong_number: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };

    const labels: Record<string, string> = {
      booked: 'Booked',
      booking_link_sent: 'Link Sent',
      linksent: 'Link Sent',
      no_answer: 'No Answer',
      noanswer: 'No Answer',
      voicemail: 'Voicemail',
      not_interested: 'Not Interested',
      notinterested: 'Not Interested',
      busy: 'Busy',
      wrong_number: 'Wrong Number',
      completed: 'Completed',
    };

    // Find matching style
    let style = 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    let label = outcome;

    for (const [key, value] of Object.entries(styles)) {
      if (normalizedOutcome.includes(key)) {
        style = value;
        label = labels[key] || outcome;
        break;
      }
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
        {label}
      </span>
    );
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
      <div className="px-6 py-4 border-b border-wellness-neutral-300 dark:border-wellness-700 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 dark:from-emerald-900 dark:via-emerald-700 dark:to-teal-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">
              Completed Calls
            </h2>
            <p className="text-sm text-white/90">
              {calls.length} {calls.length === 1 ? 'call' : 'calls'} completed today
            </p>
          </div>
          {calls.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 text-white rounded-full text-sm font-medium shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Done
            </div>
          )}
        </div>
      </div>

      {/* Calls List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {calls.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="max-w-sm mx-auto">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30"></div>
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>

              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                No Completed Calls Yet
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Completed calls from your queue will appear here as they're processed.
              </p>
            </div>
          </div>
        ) : (
          calls.slice(0, 10).map((call, index) => (
            <div
              key={call.id}
              className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Position indicator */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-700 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
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
                    <div className="flex flex-col items-end gap-1">
                      {getTypeBadge(call.type)}
                      {getOutcomeBadge(call.callOutcome)}
                    </div>
                  </div>

                  {/* Call time */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Called {formatDateTimeShortAWST(call.calledAt)}
                    </span>
                    {call.callDuration && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                        <span>{Math.floor(call.callDuration / 60)}:{(call.callDuration % 60).toString().padStart(2, '0')} min</span>
                      </>
                    )}
                  </div>

                  {/* Summary preview */}
                  {call.summary && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {call.summary}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer - Show More */}
      {calls.length > 10 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-center text-gray-600 dark:text-gray-300">
            Showing 10 of {calls.length} completed calls
          </p>
        </div>
      )}
    </div>
  );
}
