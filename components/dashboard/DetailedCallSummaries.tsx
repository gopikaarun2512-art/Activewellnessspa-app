'use client';

import { VAPICall } from '@/types/analytics';
import { formatShortTimeAWST, formatDateTimeShortAWST } from '@/lib/timezone';

interface DetailedCallSummariesProps {
  vapiCalls: VAPICall[];
}

export default function DetailedCallSummaries({ vapiCalls }: DetailedCallSummariesProps) {
  // Filter VAPI calls that have summaries
  const callsWithSummaries = vapiCalls.filter(call => call.summary && call.summary.trim().length > 0);

  if (callsWithSummaries.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-wellness-neutral-300/30 dark:border-wellness-700/30 shadow-premium-lg hover-lift backdrop-blur-sm shadow-sm p-12">
        <div className="text-center max-w-md mx-auto">
          {/* Enhanced illustration */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-wellness-100 to-wellness-200 dark:from-wellness-900/30 dark:to-wellness-800/30 animate-pulse"></div>
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-wellness-50 to-wellness-100 dark:from-wellness-900/20 dark:to-wellness-800/20 flex items-center justify-center">
              <svg className="w-12 h-12 text-wellness-500 dark:text-wellness-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            No Call Summaries Available
          </h3>
          <p className="text-base text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Call summaries from your conversations will appear here. Start making calls to see detailed notes and insights.
          </p>

          {/* Helpful tips */}
          <div className="bg-wellness-50/50 dark:bg-wellness-900/10 rounded-lg p-4 border border-wellness-200/30 dark:border-wellness-700/20">
            <div className="flex items-start gap-3 text-left">
              <svg className="w-5 h-5 text-wellness-600 dark:text-wellness-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Summaries are automatically generated after each completed call with notes about the conversation.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-wellness-neutral-300/30 dark:border-wellness-700/30 shadow-premium-lg hover-lift backdrop-blur-sm shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#B44C45] via-[#D4A59A] to-[#ECE3DC] dark:from-wellness-900 dark:via-wellness-700 dark:to-wellness-neutral-800 border-b border-wellness-neutral-300 dark:border-wellness-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-wellness-900 dark:bg-wellness-600 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white dark:text-wellness-neutral-100">
                Detailed Call Summaries
              </h2>
              <p className="text-sm text-white/90 dark:text-wellness-neutral-300">
                {callsWithSummaries.length} call{callsWithSummaries.length !== 1 ? 's' : ''} with summaries
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call Summary Cards */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {callsWithSummaries.map((call) => (
          <div
            key={call.id}
            className="p-6 hover:bg-wellness-50/30 dark:hover:bg-wellness-900/5 transition-colors"
          >
            {/* Lead Name Header */}
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {call.leadName || 'Unknown Caller'}
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDateTimeShortAWST(call.startedAt)}
              </span>
            </div>

            {/* Contact Information */}
            <div className="flex flex-wrap gap-4 mb-4">
              {/* Phone */}
              <a
                href={`tel:${call.phoneNumber}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white bg-wellness-600 hover:bg-wellness-700 dark:bg-wellness-900 dark:hover:bg-wellness-600 transition-colors font-medium shadow-sm"
                title="Click to call"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{call.phoneNumber}</span>
              </a>

              {/* Duration */}
              {call.duration > 0 && (
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}</span>
                </span>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {/* Call Type Badge */}
              <span className={`
                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide
                ${call.type === 'outbound'
                  ? 'bg-wellness-100 dark:bg-wellness-900/30 text-wellness-800 dark:text-wellness-neutral-300'
                  : 'bg-wellness-blue-100 dark:bg-wellness-blue-900/30 text-wellness-blue-700 dark:text-wellness-blue-300'
                }
              `}>
                {call.type === 'outbound' ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                  </svg>
                )}
                {call.type}
              </span>

              {/* Status Badge */}
              <span className={`
                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide
                ${call.status === 'completed'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : call.status === 'voicemail'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : call.status === 'no-answer'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                }
              `}>
                {call.status === 'completed' && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {call.status}
              </span>

              {/* Outcome Badge (if different from status) */}
              {call.outcome && call.outcome !== call.status && (
                <span className={`
                  inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide
                  ${call.outcome.includes('booking') || call.outcome.includes('link')
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : call.outcome.includes('booked')
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                  }
                `}>
                  {call.outcome.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            {/* Call Summary Text */}
            <div className="bg-gradient-to-br from-wellness-50/50 to-wellness-100/50 dark:from-wellness-900/10 dark:to-wellness-800/10 rounded-lg p-4 border border-wellness-200/50 dark:border-wellness-700/30">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {call.summary}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
