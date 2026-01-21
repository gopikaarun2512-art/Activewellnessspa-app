'use client';

import { QueuedCall, Activity, FacebookLead } from '@/types/analytics';
import { addMinutes } from 'date-fns';
import { formatInAWST, formatShortTimeAWST, getNowInAWST } from '@/lib/timezone';

interface TodaysScheduleSidebarProps {
  queuedCalls: QueuedCall[];
  recentActivity: Activity[];
  facebookLeads: FacebookLead[];
  totalCalls: number;
  totalBookings: number;
}

export default function TodaysScheduleSidebar({
  queuedCalls,
  recentActivity,
  facebookLeads,
  totalCalls,
  totalBookings,
}: TodaysScheduleSidebarProps) {
  const now = getNowInAWST();
  const currentHour = now.getHours();

  // Get next 3 upcoming calls from queue
  const upcomingCalls = queuedCalls.slice(0, 3);

  // Calculate estimated time for each queued call (assuming 10 min per call)
  const getEstimatedTime = (index: number) => {
    return addMinutes(now, index * 10);
  };

  // Get recent successful bookings today
  const todaysBookings = recentActivity.filter(a => a.outcome === 'booked').slice(0, 3);

  // Calculate progress percentage
  const callProgress = Math.min((totalCalls / 10) * 100, 100);
  const bookingProgress = Math.min((totalBookings / 3) * 100, 100);

  const getPriorityBadge = (priority?: string) => {
    if (priority === 'high') {
      return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">High</span>;
    }
    return null;
  };

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-b from-wellness-neutral-200 to-wellness-neutral-50 dark:from-gray-900 dark:to-gray-950 border-l border-wellness-neutral-400 dark:border-gray-700">
      <div className="sticky top-0 bg-gradient-to-r from-[#B44C45] via-[#D4A59A] to-[#ECE3DC] dark:from-wellness-900 dark:via-wellness-700 dark:to-wellness-neutral-800 border-b border-wellness-neutral-300 dark:border-wellness-700 px-6 py-6 shadow-md z-10">
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 className="text-xl font-bold text-white dark:text-wellness-neutral-100">Today's Schedule</h2>
        </div>
        <p className="text-white/90 dark:text-wellness-neutral-300 text-sm">
          {formatInAWST(now, 'EEEE, MMMM d')} (AWST)
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Daily Progress */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-wellness-neutral-400 dark:border-gray-700 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-wellness-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Daily Progress
          </h3>

          <div className="space-y-4">
            {/* Calls Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-600 dark:text-gray-300 font-medium">Calls</span>
                <span className="text-wellness-600 dark:text-wellness-400 font-bold">{totalCalls}/10</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-wellness-500 to-wellness-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${callProgress}%` }}
                />
              </div>
            </div>

            {/* Bookings Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-600 dark:text-gray-300 font-medium">Bookings</span>
                <span className="text-wellness-success-600 dark:text-wellness-success-400 font-bold">{totalBookings}/3</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-wellness-success-500 to-wellness-success-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${bookingProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Calls */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-wellness-neutral-400 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-wellness-500 to-wellness-600 px-5 py-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Up Next ({upcomingCalls.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {upcomingCalls.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-wellness-100 dark:bg-wellness-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-wellness-600 dark:text-wellness-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">All caught up!</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No pending calls in queue</p>
              </div>
            ) : (
              upcomingCalls.map((call, index) => (
                <div key={call.id} className="px-5 py-4 hover:bg-wellness-50 dark:hover:bg-wellness-900/10 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-wellness-500 text-white text-xs font-bold">
                          {index + 1}
                        </span>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {call.leadName}
                        </p>
                        {getPriorityBadge(call.priority)}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-mono ml-8">
                        {call.phone}
                      </p>
                    </div>
                  </div>
                  <div className="ml-8 flex items-center gap-2 text-xs text-wellness-600 dark:text-wellness-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">~{formatShortTimeAWST(getEstimatedTime(index))}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Bookings */}
        {todaysBookings.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-wellness-success-200 dark:border-wellness-success-800 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-wellness-success-500 to-wellness-success-600 px-5 py-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Today's Bookings
              </h3>
            </div>

            <div className="divide-y divide-wellness-success-100 dark:divide-wellness-success-900/30">
              {todaysBookings.map((booking) => (
                <div key={booking.id} className="px-5 py-3 hover:bg-wellness-success-50 dark:hover:bg-wellness-success-900/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-wellness-success-100 dark:bg-wellness-success-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-wellness-success-600 dark:text-wellness-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {booking.leadName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {formatShortTimeAWST(booking.time)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Facebook Leads */}
        {facebookLeads.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                FB Leads ({facebookLeads.length})
              </h3>
            </div>

            <div className="divide-y divide-blue-100 dark:divide-blue-900/30 max-h-64 overflow-y-auto">
              {facebookLeads.slice(0, 5).map((lead) => (
                <div key={lead.id} className="px-5 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {lead.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {lead.status === 'new' && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                            New
                          </span>
                        )}
                        {lead.status === 'booked' && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                            Booked
                          </span>
                        )}
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {formatShortTimeAWST(lead.createdTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {lead.phone && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-mono ml-11 mt-1">
                      {lead.phone}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-wellness-500 to-wellness-600 rounded-xl p-5 text-white shadow-lg">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Stats
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-wellness-100">Calls Today</span>
              <span className="font-bold text-lg">{totalCalls}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-wellness-100">Success Rate</span>
              <span className="font-bold text-lg">
                {totalCalls > 0 ? Math.round((totalBookings / totalCalls) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-wellness-100">Queue Remaining</span>
              <span className="font-bold text-lg">{queuedCalls.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-wellness-100">FB Leads Today</span>
              <span className="font-bold text-lg">{facebookLeads.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
