'use client';

import { Activity, CallOutcome } from '@/types/analytics';

interface CallSummaryPanelProps {
  recentActivity: Activity[];
  outcomes: CallOutcome[];
  totalCalls: number;
  totalBookings: number;
  conversionRate: number;
  isRefreshing?: boolean;
}

export default function CallSummaryPanel({
  recentActivity,
  outcomes,
  totalCalls,
  totalBookings,
  conversionRate,
  isRefreshing = false,
}: CallSummaryPanelProps) {
  // Calculate statistics
  const inboundCalls = recentActivity.filter(a => a.type === 'inbound').length;
  const outboundCalls = recentActivity.filter(a => a.type === 'outbound').length;

  // Calculate average lead score
  const scoresWithValues = recentActivity
    .map(a => a.leadScore)
    .filter((score): score is number => typeof score === 'number' && score > 0);
  const avgLeadScore = scoresWithValues.length > 0
    ? Math.round(scoresWithValues.reduce((a, b) => a + b, 0) / scoresWithValues.length)
    : 0;

  // Get outcome counts
  const bookedCount = outcomes.find(o => o.type === 'booked')?.count || 0;
  const noAnswerCount = outcomes.find(o => o.type === 'noAnswer')?.count || 0;
  const voicemailCount = outcomes.find(o => o.type === 'voicemail')?.count || 0;
  const notInterestedCount = outcomes.find(o => o.type === 'notInterested')?.count || 0;
  const otherCount = outcomes.find(o => o.type === 'other')?.count || 0;

  const getOutcomeColor = (type: string) => {
    const colors = {
      booked: 'text-wellness-success-600 dark:text-wellness-success-400 bg-wellness-success-50 dark:bg-wellness-success-900/20',
      noAnswer: 'text-wellness-warning-600 dark:text-wellness-warning-400 bg-wellness-warning-50 dark:bg-wellness-warning-900/20',
      voicemail: 'text-wellness-blue-600 dark:text-wellness-blue-400 bg-wellness-blue-50 dark:bg-wellness-blue-900/20',
      notInterested: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800',
      other: 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900',
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-wellness-neutral-300/30 dark:border-wellness-700/30 shadow-premium-lg hover-lift backdrop-blur-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#B44C45] via-[#B44C45] to-[#B44C45] dark:from-wellness-900 dark:via-wellness-700 dark:to-wellness-neutral-800 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Call Summary
            </h2>
            <p className="text-sm text-white/80 mt-0.5">
              Today's performance overview
            </p>
          </div>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Total Calls */}
          <div className={`bg-gradient-to-br from-[#C85A52] via-[#B44C45] to-[#A34139] dark:from-wellness-900/40 dark:to-wellness-800/40 rounded-xl p-5 shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:scale-105 ${isRefreshing ? 'shimmer' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-white/90 dark:text-wellness-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-xs font-medium text-white/90 dark:text-wellness-200">Total Calls</span>
            </div>
            <p className="text-3xl font-bold tracking-tight text-white dark:text-wellness-100">{totalCalls}</p>
          </div>

          {/* Bookings */}
          <div className={`bg-gradient-to-br from-[#B44C45] via-[#A34139] to-[#8B3830] dark:from-wellness-800/40 dark:to-wellness-900/40 rounded-xl p-5 shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:scale-105 ${isRefreshing ? 'shimmer' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-white/90 dark:text-wellness-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-white/90 dark:text-wellness-200">Bookings</span>
            </div>
            <p className="text-3xl font-bold tracking-tight text-white dark:text-wellness-100">{totalBookings}</p>
          </div>

          {/* Conversion Rate */}
          <div className={`bg-gradient-to-br from-[#B44C45] to-[#D4A59A] dark:from-wellness-900/40 dark:to-wellness-700/40 rounded-xl p-5 shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:scale-105 ${isRefreshing ? 'shimmer' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-white/90 dark:text-wellness-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-xs font-medium text-white/90 dark:text-wellness-200">Conversion</span>
            </div>
            <p className="text-3xl font-bold tracking-tight text-white dark:text-wellness-100">{conversionRate.toFixed(1)}%</p>
          </div>

          {/* Avg Lead Score */}
          <div className={`bg-gradient-to-br from-[#D4A59A] to-[#ECE3DC] dark:from-wellness-700/40 dark:to-wellness-neutral-800/40 rounded-xl p-5 shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:scale-105 ${isRefreshing ? 'shimmer' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-wellness-900 dark:text-wellness-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span className="text-xs font-medium text-wellness-900 dark:text-wellness-200">Avg Score</span>
            </div>
            <p className="text-3xl font-bold tracking-tight text-wellness-900 dark:text-wellness-100">{avgLeadScore}</p>
          </div>
        </div>

        {/* Call Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:scale-105">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Call Direction
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-wellness-500"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Inbound</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{inboundCalls}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-wellness-blue-500"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Outbound</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{outboundCalls}</span>
              </div>
            </div>
          </div>

          {/* Call Outcomes Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:scale-105">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Outcomes
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className={`px-2 py-1.5 rounded ${getOutcomeColor('booked')}`}>
                <div className="text-xs font-medium">Booked</div>
                <div className="text-lg font-bold">{bookedCount}</div>
              </div>
              <div className={`px-2 py-1.5 rounded ${getOutcomeColor('noAnswer')}`}>
                <div className="text-xs font-medium">No Answer</div>
                <div className="text-lg font-bold">{noAnswerCount}</div>
              </div>
              <div className={`px-2 py-1.5 rounded ${getOutcomeColor('voicemail')}`}>
                <div className="text-xs font-medium">Voicemail</div>
                <div className="text-lg font-bold">{voicemailCount}</div>
              </div>
              <div className={`px-2 py-1.5 rounded ${getOutcomeColor('notInterested')}`}>
                <div className="text-xs font-medium">Not Interested</div>
                <div className="text-lg font-bold">{notInterestedCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="bg-gradient-to-r from-wellness-500 to-wellness-600 rounded-xl p-5 shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:scale-105 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-wellness-100 mb-1">Today's Performance</p>
              <p className="text-3xl font-bold tracking-tight">
                {conversionRate >= 30 ? 'Excellent' : conversionRate >= 20 ? 'Good' : conversionRate >= 10 ? 'Fair' : 'Needs Improvement'}
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              {conversionRate >= 30 ? (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              ) : conversionRate >= 10 ? (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs text-wellness-100">
              {totalCalls === 0 ? (
                "No calls made today. Start making calls to see your performance!"
              ) : conversionRate >= 30 ? (
                `Outstanding conversion rate! You've booked ${totalBookings} out of ${totalCalls} calls.`
              ) : conversionRate >= 20 ? (
                `Great work! Keep up the momentum with ${totalBookings} bookings from ${totalCalls} calls.`
              ) : conversionRate >= 10 ? (
                `You're on track. Focus on quality conversations to improve from ${totalBookings}/${totalCalls}.`
              ) : (
                `Room for improvement. Review call strategies to boost ${totalBookings}/${totalCalls} conversion.`
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
