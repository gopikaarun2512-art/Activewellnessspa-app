'use client';

import { FacebookLead, PipelineStage, PipelineSummary } from '@/types/analytics';
import { useMemo } from 'react';

interface LeadPipelineOverviewProps {
  leads: FacebookLead[];
  pipelineSummary?: PipelineSummary;
  selectedStage: PipelineStage | null;
  onStageSelect: (stage: PipelineStage | null) => void;
}

const STAGE_CONFIG: Record<PipelineStage, {
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  borderColor: string;
  selectedBg: string;
}> = {
  'lead_submitted': {
    label: 'FB Lead Submitted',
    shortLabel: 'Submitted',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
    selectedBg: 'bg-blue-100 dark:bg-blue-900/50',
  },
  'call_pending': {
    label: 'Call Pending',
    shortLabel: 'Pending',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-800',
    selectedBg: 'bg-amber-100 dark:bg-amber-900/50',
  },
  'call_completed': {
    label: 'Call Completed',
    shortLabel: 'Completed',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    textColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-200 dark:border-green-800',
    selectedBg: 'bg-green-100 dark:bg-green-900/50',
  },
  'booking_confirmed': {
    label: 'Booking Confirmed',
    shortLabel: 'Booked',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bgColor: 'bg-wellness-50 dark:bg-wellness-950/30',
    textColor: 'text-wellness-700 dark:text-wellness-400',
    borderColor: 'border-wellness-200 dark:border-wellness-800',
    selectedBg: 'bg-wellness-100 dark:bg-wellness-900/50',
  },
};

const STAGES_ORDER: PipelineStage[] = [
  'lead_submitted',
  'call_pending',
  'call_completed',
  'booking_confirmed',
];

export default function LeadPipelineOverview({
  leads,
  pipelineSummary,
  selectedStage,
  onStageSelect,
}: LeadPipelineOverviewProps) {
  // Calculate summary from leads if not provided
  const summary = useMemo(() => {
    if (pipelineSummary) return pipelineSummary;

    const byStage: Record<PipelineStage, number> = {
      'lead_submitted': 0,
      'call_pending': 0,
      'call_completed': 0,
      'booking_confirmed': 0,
    };

    leads.forEach(lead => {
      const stage = lead.journey?.pipelineStage || 'lead_submitted';
      byStage[stage]++;
    });

    const totalLeads = leads.length;

    return {
      totalLeads,
      byStage,
      stages: STAGES_ORDER.map(stage => ({
        stage,
        count: byStage[stage],
        percentage: totalLeads > 0 ? (byStage[stage] / totalLeads) * 100 : 0,
      })),
      conversionRate: totalLeads > 0 ? (byStage['booking_confirmed'] / totalLeads) * 100 : 0,
      avgTimeToCall: null,
      avgTimeToBooking: null,
    };
  }, [leads, pipelineSummary]);

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '-';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-wellness-neutral-300/30 dark:border-wellness-700/30 shadow-premium-lg backdrop-blur-sm mb-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-wellness-500 to-wellness-700 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Lead Pipeline
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {summary.totalLeads} lead{summary.totalLeads !== 1 ? 's' : ''} • {summary.conversionRate.toFixed(1)}% conversion
              </p>
            </div>
          </div>

          {/* Clear filter button */}
          {selectedStage && (
            <button
              onClick={() => onStageSelect(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Pipeline Visualization */}
      <div className="p-6">
        <div className="flex items-stretch gap-2">
          {STAGES_ORDER.map((stage, index) => {
            const config = STAGE_CONFIG[stage];
            const stageData = summary.stages.find(s => s.stage === stage);
            const count = stageData?.count || 0;
            const isSelected = selectedStage === stage;
            const isLast = index === STAGES_ORDER.length - 1;

            return (
              <div key={stage} className="flex items-center flex-1">
                {/* Stage Card */}
                <button
                  onClick={() => onStageSelect(isSelected ? null : stage)}
                  className={`
                    flex-1 p-4 rounded-xl border-2 transition-all duration-200
                    ${isSelected
                      ? `${config.selectedBg} ${config.borderColor} ring-2 ring-offset-2 ring-${config.textColor.split('-')[1]}-500/50`
                      : `${config.bgColor} border-transparent hover:${config.borderColor}`
                    }
                    hover:shadow-md cursor-pointer
                  `}
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Icon */}
                    <div className={`mb-2 ${config.textColor}`}>
                      {config.icon}
                    </div>

                    {/* Count */}
                    <div className={`text-2xl font-bold ${config.textColor}`}>
                      {count}
                    </div>

                    {/* Label */}
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
                      <span className="hidden sm:inline">{config.label}</span>
                      <span className="sm:hidden">{config.shortLabel}</span>
                    </div>

                    {/* Percentage */}
                    {summary.totalLeads > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                        {((count / summary.totalLeads) * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </button>

                {/* Arrow connector */}
                {!isLast && (
                  <div className="flex items-center px-1 text-gray-300 dark:text-gray-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Metrics Row */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Avg. time to call:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatTime(summary.avgTimeToCall)}
            </span>
          </div>

          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Conversion rate:</span>
            <span className="font-semibold text-wellness-700 dark:text-wellness-400">
              {summary.conversionRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Selected stage indicator */}
      {selectedStage && (
        <div className={`px-6 py-3 ${STAGE_CONFIG[selectedStage].bgColor} border-t ${STAGE_CONFIG[selectedStage].borderColor}`}>
          <div className={`flex items-center justify-center gap-2 text-sm font-medium ${STAGE_CONFIG[selectedStage].textColor}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Showing {summary.byStage[selectedStage]} lead{summary.byStage[selectedStage] !== 1 ? 's' : ''} in &quot;{STAGE_CONFIG[selectedStage].label}&quot;
          </div>
        </div>
      )}
    </div>
  );
}
