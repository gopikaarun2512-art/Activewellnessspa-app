'use client';

import { FacebookLead, PipelineStage } from '@/types/analytics';
import { formatInAWST } from '@/lib/timezone';
import { useState } from 'react';

interface LeadPipelineDetailProps {
  leads: FacebookLead[];
  selectedStage: PipelineStage | null;
}

// Format time as "3:00 pm"
function formatTime(dateString: string): string {
  return formatInAWST(dateString, 'h:mm a').toLowerCase();
}

// Format date as "28 Jan"
function formatDate(dateString: string): string {
  return formatInAWST(dateString, 'd MMM');
}

function LeadTimelineRow({ lead }: { lead: FacebookLead }) {
  const [showSummary, setShowSummary] = useState(false);
  const journey = lead.journey;

  // Build timeline text
  const timelineSteps: string[] = [];

  // 1. Form submitted
  timelineSteps.push(`form submitted at ${formatTime(lead.createdTime)}`);

  // 2. Queued or instant
  if (journey?.queuedAt) {
    timelineSteps.push(`added to queue at ${formatTime(journey.queuedAt)}`);
  }

  // 3. Call made via VAPI
  if (journey?.contactedAt) {
    const callTime = formatTime(journey.contactedAt);
    if (journey.contactMethod === 'instant') {
      timelineSteps.push(`instant call at ${callTime} in VAPI`);
    } else {
      timelineSteps.push(`called at ${callTime} in VAPI`);
    }
  } else if (journey?.contactMethod === 'queued' && !journey.contactedAt) {
    timelineSteps.push('waiting in queue...');
  }

  // 4. Call outcome
  if (journey?.callOutcome) {
    const outcomeLabels: Record<string, string> = {
      'booking_link_sent': 'booking link sent',
      'no_answer': 'no answer',
      'voicemail': 'voicemail left',
      'not_interested': 'not interested',
      'callback_requested': 'callback requested',
      'busy': 'line busy',
      'wrong_number': 'wrong number',
      'completed': 'call completed',
      'customer-did-not-answer': 'customer did not answer',
      'interested': 'interested',
    };
    const outcomeText = outcomeLabels[journey.callOutcome.toLowerCase()] || journey.callOutcome.replace(/_/g, ' ');
    timelineSteps.push(outcomeText);
  }

  // 5. Callback scheduled
  if (journey?.callbackScheduledAt) {
    timelineSteps.push(`callback scheduled at ${formatTime(journey.callbackScheduledAt)}`);
  }

  // 6. Booking confirmed
  if (journey?.isBooked) {
    timelineSteps.push('booked in GymMaster ✓');
  }

  // Get status color
  const getStatusColor = () => {
    if (journey?.isBooked) return 'text-wellness-600 dark:text-wellness-400';
    if (journey?.callOutcome === 'booking_link_sent') return 'text-emerald-600 dark:text-emerald-400';
    if (journey?.callOutcome === 'interested') return 'text-green-600 dark:text-green-400';
    if (journey?.contactedAt) return 'text-green-600 dark:text-green-400';
    if (journey?.contactMethod === 'queued' && !journey.contactedAt) return 'text-amber-600 dark:text-amber-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  // Get status indicator
  const getStatusIndicator = () => {
    if (journey?.isBooked) return '✓';
    if (journey?.callOutcome === 'no_answer' || journey?.callOutcome === 'customer-did-not-answer') return '✗';
    if (journey?.callOutcome === 'voicemail') return '📞';
    if (journey?.contactedAt) return '✓';
    if (journey?.contactMethod === 'queued' && !journey.contactedAt) return '⏳';
    return '●';
  };

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      {/* Main Row */}
      <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
        {/* Status Indicator */}
        <div className={`text-lg ${getStatusColor()}`}>
          {getStatusIndicator()}
        </div>

        {/* Lead Name */}
        <div className="w-40 flex-shrink-0">
          <div className="font-semibold text-gray-900 dark:text-white truncate">
            {lead.name}
          </div>
          {lead.phone && (
            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {lead.phone}
            </div>
          )}
        </div>

        {/* Timeline Flow */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-1 text-sm">
            {timelineSteps.map((step, idx) => (
              <span key={idx} className="flex items-center">
                {idx > 0 && (
                  <svg className="w-4 h-4 mx-1 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
                <span className={`whitespace-nowrap ${
                  step.includes('waiting')
                    ? 'text-amber-600 dark:text-amber-400 font-medium animate-pulse'
                    : step.includes('booked') || step.includes('✓')
                    ? 'text-wellness-600 dark:text-wellness-400 font-medium'
                    : step.includes('not answer') || step.includes('wrong') || step.includes('not interested')
                    ? 'text-red-500 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {step}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Date & Summary Toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
            {formatDate(lead.createdTime)}
          </div>

          {journey?.callSummary && (
            <button
              onClick={() => setShowSummary(!showSummary)}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                showSummary
                  ? 'bg-wellness-100 dark:bg-wellness-900/30 text-wellness-700 dark:text-wellness-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {showSummary ? 'Hide Summary' : 'View Summary'}
            </button>
          )}
        </div>
      </div>

      {/* Call Summary (Expandable) */}
      {showSummary && journey?.callSummary && (
        <div className="px-4 pb-3 pl-14">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 leading-relaxed border-l-4 border-wellness-500">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-wellness-600 dark:text-wellness-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <div className="font-medium text-gray-900 dark:text-white mb-1">Call Summary</div>
                {journey.callSummary}
                {journey.callDuration && journey.callDuration > 0 && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Duration: {Math.floor(journey.callDuration / 60)}m {journey.callDuration % 60}s
                    {journey.totalAttempts && journey.totalAttempts > 1 && ` • ${journey.totalAttempts} attempts`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details (if booked) */}
      {journey?.bookingDetails && journey.bookingDetails.length > 0 && (
        <div className="px-4 pb-3 pl-14">
          <div className="flex flex-wrap gap-2">
            {journey.bookingDetails.map((booking, idx) => (
              <div key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-wellness-50 dark:bg-wellness-900/20 rounded-full text-sm">
                <svg className="w-4 h-4 text-wellness-600 dark:text-wellness-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-wellness-700 dark:text-wellness-300 font-medium">
                  {booking.serviceName} - {booking.day} at {booking.startTime}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeadPipelineDetail({ leads, selectedStage }: LeadPipelineDetailProps) {
  // Filter leads by selected stage if any
  const filteredLeads = selectedStage
    ? leads.filter(lead => (lead.journey?.pipelineStage || 'lead_submitted') === selectedStage)
    : leads;

  // Sort by most recent first
  const sortedLeads = [...filteredLeads].sort((a, b) =>
    new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
  );

  if (sortedLeads.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-wellness-neutral-300/30 dark:border-wellness-700/30 shadow-premium-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {selectedStage ? 'No leads in this stage' : 'No leads yet'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {selectedStage
            ? 'Try selecting a different pipeline stage to see leads.'
            : 'New leads will appear here when they submit forms.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-wellness-neutral-300/30 dark:border-wellness-700/30 shadow-premium-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-wellness-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-wellness-500 to-wellness-700 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Lead Journey Timeline
            </h2>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {sortedLeads.length} lead{sortedLeads.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700">
        <div className="w-6"></div>
        <div className="w-40 flex-shrink-0">Lead</div>
        <div className="flex-1">Status Timeline</div>
        <div className="w-28 text-right">Date</div>
      </div>

      {/* Leads List */}
      <div className="max-h-[500px] overflow-y-auto">
        {sortedLeads.map((lead) => (
          <LeadTimelineRow key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}
