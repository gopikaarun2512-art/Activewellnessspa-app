'use client';

import { FacebookLead } from '@/types/analytics';
import { format } from 'date-fns';

interface FacebookLeadsPanelProps {
  facebookLeads: FacebookLead[];
}

export default function FacebookLeadsPanel({ facebookLeads }: FacebookLeadsPanelProps) {
  const getStatusBadge = (status: FacebookLead['status']) => {
    const badges = {
      new: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      contacted: 'bg-wellness-blue-100 dark:bg-wellness-blue-900/30 text-wellness-blue-700 dark:text-wellness-blue-400',
      qualified: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      booked: 'bg-wellness-success-100 dark:bg-wellness-success-900/30 text-wellness-800 dark:text-wellness-success-400',
      not_interested: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400',
    };

    const labels = {
      new: 'New',
      contacted: 'Contacted',
      qualified: 'Qualified',
      booked: 'Booked',
      not_interested: 'Not Interested',
    };

    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getSourceBadge = (source: FacebookLead['source']) => {
    const badges = {
      facebook_ad: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
      facebook_page: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400',
    };

    const labels = {
      facebook_ad: 'FB Ad',
      facebook_page: 'FB Page',
    };

    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${badges[source]}`}>
        {labels[source]}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-wellness-neutral-300/30 dark:border-wellness-700/30 shadow-premium-lg hover-lift backdrop-blur-sm shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#B44C45] via-[#D4A59A] to-[#ECE3DC] dark:from-wellness-900 dark:via-wellness-700 dark:to-wellness-neutral-800 border-b border-wellness-neutral-300 dark:border-wellness-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-wellness-900 dark:bg-wellness-600 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white dark:text-wellness-neutral-100">
                Facebook Leads
              </h2>
              <p className="text-sm text-white/90 dark:text-wellness-neutral-300">
                {facebookLeads.length} form submission{facebookLeads.length !== 1 ? 's' : ''} today
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
        {facebookLeads.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="max-w-sm mx-auto">
              {/* Enhanced Facebook icon illustration */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 animate-pulse"></div>
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                No Facebook Leads Today
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                New leads from Facebook ads and page forms will appear here automatically.
              </p>

              {/* Info box */}
              <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200/30 dark:border-blue-700/20">
                <div className="flex items-start gap-3 text-left">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Leads are synced in real-time from your Facebook campaigns and page inquiries.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          facebookLeads.map((lead) => (
            <div
              key={lead.id}
              className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Lead Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {lead.name}
                    </h3>
                    {getStatusBadge(lead.status)}
                    {getSourceBadge(lead.source)}
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-1 mb-2">
                    {lead.email && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="font-mono truncate">{lead.email}</span>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="font-mono">{lead.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Form & Ad Details */}
                  {(lead.formName || lead.adName) && (
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {lead.formName && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="truncate">{lead.formName}</span>
                        </div>
                      )}
                      {lead.adName && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                          </svg>
                          <span className="truncate">{lead.adName}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Time */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                    {format(new Date(lead.createdTime), 'h:mm a')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(lead.createdTime), 'MMM d')}
                  </div>
                </div>
              </div>

              {/* Custom Fields (if any) */}
              {lead.customFields && Object.keys(lead.customFields).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-medium text-wellness-600 dark:text-wellness-400 hover:text-wellness-700 dark:hover:text-wellness-300 flex items-center gap-1">
                      <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      View custom fields
                    </summary>
                    <div className="mt-2 space-y-1 pl-4">
                      {Object.entries(lead.customFields).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-2 text-xs">
                          <span className="font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">
                            {key}:
                          </span>
                          <span className="text-gray-900 dark:text-white">{value}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary Footer */}
      {facebookLeads.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-wellness-600"></div>
                <span className="text-gray-600 dark:text-gray-300">
                  {facebookLeads.filter(l => l.status === 'booked').length} Booked
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-gray-600 dark:text-gray-300">
                  {facebookLeads.filter(l => l.status === 'new').length} New
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="text-gray-600 dark:text-gray-300">
                  {facebookLeads.filter(l => l.status === 'qualified').length} Qualified
                </span>
              </div>
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              Total: {facebookLeads.length} lead{facebookLeads.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
