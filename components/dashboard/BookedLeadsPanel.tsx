'use client';

import { FacebookLead } from '@/types/analytics';
import { formatShortTimeAWST, formatInAWST } from '@/lib/timezone';

interface BookedLeadsPanelProps {
  facebookLeads: FacebookLead[];
}

export default function BookedLeadsPanel({ facebookLeads }: BookedLeadsPanelProps) {
  // Filter leads that have confirmed bookings
  const bookedLeads = facebookLeads.filter(
    (lead) => lead.journey?.isBooked || lead.status === 'booked'
  );

  if (bookedLeads.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-wellness-neutral-300/30 dark:border-wellness-700/30 shadow-premium-lg hover-lift backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-wellness-neutral-300 dark:border-wellness-700 bg-gradient-to-r from-wellness-success-600 via-wellness-success-500 to-emerald-500 dark:from-wellness-success-900 dark:via-wellness-success-700 dark:to-emerald-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Confirmed Bookings</h2>
              <p className="text-sm text-white/90">0 bookings today</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="px-6 py-12 text-center">
          <div className="max-w-sm mx-auto">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-wellness-success-100 to-wellness-success-200 dark:from-wellness-success-900/30 dark:to-wellness-success-800/30"></div>
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-wellness-success-50 to-wellness-success-100 dark:from-wellness-success-900/20 dark:to-wellness-success-800/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-wellness-success-600 dark:text-wellness-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              No Bookings Yet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Leads who book appointments will appear here with their booking details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-wellness-success-200/50 dark:border-wellness-success-700/30 shadow-premium-lg hover-lift backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-wellness-success-200 dark:border-wellness-success-700 bg-gradient-to-r from-wellness-success-600 via-wellness-success-500 to-emerald-500 dark:from-wellness-success-900 dark:via-wellness-success-700 dark:to-emerald-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">Confirmed Bookings</h2>
            <p className="text-sm text-white/90">
              {bookedLeads.length} booking{bookedLeads.length !== 1 ? 's' : ''} today
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 text-white rounded-full text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Success
          </div>
        </div>
      </div>

      {/* Booked Leads List */}
      <div className="divide-y divide-wellness-success-100 dark:divide-wellness-success-900/30">
        {bookedLeads.map((lead) => (
          <div
            key={lead.id}
            className="px-6 py-5 hover:bg-wellness-success-50/30 dark:hover:bg-wellness-success-900/10 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* Success Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-wellness-success-100 to-wellness-success-200 dark:from-wellness-success-900/30 dark:to-wellness-success-800/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-wellness-success-600 dark:text-wellness-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Lead Details */}
              <div className="flex-1 min-w-0">
                {/* Name and Status */}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {lead.name}
                  </h3>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-wellness-success-100 dark:bg-wellness-success-900/30 text-wellness-success-700 dark:text-wellness-success-400">
                    BOOKED
                  </span>
                </div>

                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 mb-3">
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-wellness-600 dark:hover:text-wellness-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="font-mono">{lead.phone}</span>
                    </a>
                  )}
                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-wellness-600 dark:hover:text-wellness-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate max-w-[200px]">{lead.email}</span>
                    </a>
                  )}
                </div>

                {/* Booking Details */}
                {lead.journey?.bookingDetails && lead.journey.bookingDetails.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-wellness-success-600 dark:text-wellness-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Appointment Details
                    </div>
                    {lead.journey.bookingDetails.map((booking, idx) => (
                      <div
                        key={idx}
                        className="bg-gradient-to-r from-wellness-success-50 to-emerald-50 dark:from-wellness-success-900/20 dark:to-emerald-900/20 rounded-xl px-4 py-3 border border-wellness-success-200 dark:border-wellness-success-700/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-wellness-success-100 dark:bg-wellness-success-800/50 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-wellness-success-600 dark:text-wellness-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white text-base">
                              {booking.serviceName}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">{booking.day}</span>
                              <span>at</span>
                              <span className="font-medium">{booking.startTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-wellness-success-50 dark:bg-wellness-success-900/20 rounded-lg px-4 py-3 border border-wellness-success-200 dark:border-wellness-success-700/50">
                    <div className="flex items-center gap-2 text-sm text-wellness-success-700 dark:text-wellness-success-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Booking confirmed in GymMaster</span>
                    </div>
                  </div>
                )}

                {/* Lead Source and Time */}
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    {lead.source === 'facebook_ad' ? 'FB Ad' : 'FB Page'}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                  <span>Lead received: {formatShortTimeAWST(lead.createdTime)}</span>
                  {lead.journey?.contactedAt && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                      <span>Called: {formatShortTimeAWST(lead.journey.contactedAt)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Time Badge */}
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-bold text-wellness-success-600 dark:text-wellness-success-400">
                  {formatShortTimeAWST(lead.createdTime)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatInAWST(lead.createdTime, 'MMM d')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="border-t border-wellness-success-200 dark:border-wellness-success-700/50 px-6 py-4 bg-gradient-to-r from-wellness-success-50/50 to-emerald-50/50 dark:from-wellness-success-900/10 dark:to-emerald-900/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-wellness-success-700 dark:text-wellness-success-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {bookedLeads.length} successful booking{bookedLeads.length !== 1 ? 's' : ''} today
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Auto-verified via GymMaster
          </div>
        </div>
      </div>
    </div>
  );
}
