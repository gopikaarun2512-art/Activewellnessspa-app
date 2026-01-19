import { Activity } from '@/types/analytics';
import { format } from 'date-fns';

interface RecentActivityTableProps {
  activities: Activity[];
}

export default function RecentActivityTable({ activities }: RecentActivityTableProps) {
  const getOutcomeBadge = (outcome: Activity['outcome']) => {
    const styles: Record<string, string> = {
      booked: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      linkSent: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      noAnswer: 'bg-wellness-warning-100 text-wellness-warning-800 dark:bg-wellness-warning-900/30 dark:text-wellness-warning-400',
      voicemail: 'bg-wellness-blue-100 text-wellness-blue-800 dark:bg-wellness-blue-900/30 dark:text-wellness-blue-400',
      notInterested: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    };

    // Labels:
    // - booked = GymMaster confirmed booking (is_booked === true)
    // - linkSent = booking_link_sent (lead interested, link sent but NOT confirmed in GymMaster)
    // - other = callback_requested, unknown outcomes
    const labels: Record<string, string> = {
      booked: 'Booked (GymMaster)',
      linkSent: 'Link Sent',
      noAnswer: 'No Answer',
      voicemail: 'Voicemail',
      notInterested: 'Not Interested',
      other: 'Other',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[outcome] || styles.other}`}>
        {labels[outcome] || 'Other'}
      </span>
    );
  };

  const getTypeBadge = (type: 'inbound' | 'outbound') => {
    return type === 'inbound' ? (
      <span className="inline-flex items-center gap-1 text-wellness-600 dark:text-wellness-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
        <span className="text-xs font-medium">In</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-wellness-blue-600 dark:text-wellness-blue-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
        <span className="text-xs font-medium">Out</span>
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-wellness-neutral-300/30 dark:border-wellness-700/30 shadow-premium-lg hover-lift backdrop-blur-sm overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-wellness-neutral-300 dark:border-wellness-700 bg-gradient-to-r from-[#B44C45] via-[#D4A59A] to-[#ECE3DC] dark:from-wellness-900 dark:via-wellness-700 dark:to-wellness-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-wellness-900 dark:bg-wellness-600 flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white dark:text-wellness-neutral-100">
              Recent Activity
            </h2>
            <p className="text-sm text-white/90 dark:text-wellness-neutral-300 mt-1">
              Latest call activity from today
            </p>
          </div>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="block lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
        {activities.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <div className="max-w-sm mx-auto">
              {/* Enhanced phone illustration */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-wellness-100 to-wellness-200 dark:from-wellness-900/30 dark:to-wellness-800/30 animate-pulse"></div>
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-wellness-50 to-wellness-100 dark:from-wellness-900/20 dark:to-wellness-800/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-wellness-600 dark:text-wellness-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                No Activity Yet
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Call activity will appear here in real-time as calls are made
              </p>
            </div>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getTypeBadge(activity.type)}
                  <span className="text-xs text-gray-500 dark:text-gray-300">
                    {format(new Date(activity.time), 'h:mm a')}
                  </span>
                </div>
                {getOutcomeBadge(activity.outcome)}
              </div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">
                {activity.leadName || 'Unknown'}
              </p>
              {activity.leadScore !== undefined && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Score: <span className="font-semibold">{activity.leadScore}</span>
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Time
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Phone
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Lead Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Outcome
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {activities.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16">
                  <div className="text-center max-w-sm mx-auto">
                    {/* Enhanced phone illustration */}
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-wellness-100 to-wellness-200 dark:from-wellness-900/30 dark:to-wellness-800/30 animate-pulse"></div>
                      <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-wellness-50 to-wellness-100 dark:from-wellness-900/20 dark:to-wellness-800/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-wellness-600 dark:text-wellness-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      No Call Activity Today
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Recent call activity will be displayed here in real-time as calls are made
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              activities.map((activity) => (
                <tr
                  key={activity.id}
                  className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {format(new Date(activity.time), 'h:mm a')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeBadge(activity.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                    {activity.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {activity.leadName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getOutcomeBadge(activity.outcome)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {activity.leadScore !== undefined ? (
                      <span className="font-semibold">{activity.leadScore}</span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
