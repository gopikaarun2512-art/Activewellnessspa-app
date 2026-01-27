// Pipeline stage types for lead tracking
export type PipelineStage =
  | 'lead_submitted'     // FB lead received, no action yet
  | 'call_pending'       // In queue or scheduled for call
  | 'call_completed'     // Call finished (any outcome)
  | 'booking_confirmed'; // GymMaster booking confirmed

export interface PipelineStageSummary {
  stage: PipelineStage;
  count: number;
  percentage: number;
}

export interface PipelineSummary {
  totalLeads: number;
  byStage: Record<PipelineStage, number>;
  stages: PipelineStageSummary[];
  conversionRate: number; // lead_submitted -> booking_confirmed
  avgTimeToCall: number | null; // seconds from lead to first call
  avgTimeToBooking: number | null; // seconds from lead to booking
}

export interface DashboardMetrics {
  totalCalls: number;
  totalBookings: number;
  conversionRate: number;
  avgLeadScore: number;
  callsTrend: number; // percentage change from yesterday
  bookingsTrend: number;
  conversionTrend: number;
  scoreTrend: number;
}

export interface CallVolumeData {
  hour: number;
  inbound: number;
  outbound: number;
}

export interface CallOutcome {
  type: 'booked' | 'linkSent' | 'noAnswer' | 'voicemail' | 'notInterested' | 'other';
  count: number;
  percentage: number;
}

export interface Activity {
  id: string;
  time: string;
  type: 'inbound' | 'outbound';
  phone: string;
  leadName: string;
  outcome: 'booked' | 'linkSent' | 'noAnswer' | 'voicemail' | 'notInterested' | 'other';
  leadScore?: number;
  email?: string;
  callSummary?: string;
}

export interface QueuedCall {
  id: string;
  phone: string;
  leadName: string;
  type: 'inbound' | 'outbound';
  queuedAt: string;
  estimatedCallTime?: string;
  priority?: 'high' | 'medium' | 'low';
  workflowName?: string;
  // Extended fields for call tracking
  status?: string;
  email?: string;
  contactId?: string;
  opportunityId?: string;
  attempts?: number;
  vapiCallId?: string;
  callOutcome?: string;
  batchPosition?: number;
  callbackReason?: string;
}

// Scheduled callbacks - calls that were requested to be called back later
export interface ScheduledCallback {
  id: string;
  phone: string;
  leadName: string;
  type: 'inbound' | 'outbound';
  scheduledAt: string;         // When the callback is scheduled
  originalCallTime?: string;   // When the original call was made
  callbackReason?: string;     // Why callback was requested
  priority?: 'high' | 'medium' | 'low';
  vapiCallId?: string;
  email?: string;
}

// Completed/Instantly called - calls that have been processed
export interface CompletedCall {
  id: string;
  phone: string;
  leadName: string;
  type: 'inbound' | 'outbound';
  calledAt: string;
  callOutcome: string;
  callDuration?: number;
  vapiCallId?: string;
  summary?: string;
  email?: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  callVolume: CallVolumeData[];
  outcomes: CallOutcome[];
  recentActivity: Activity[];
  queuedCalls: QueuedCall[];           // Calls waiting in queue (not yet called)
  scheduledCallbacks: ScheduledCallback[];  // Callbacks scheduled for later
  completedCalls: CompletedCall[];      // Calls that have been made (instantly called)
  vapiCalls: VAPICall[];               // All VAPI calls for the day (with summaries)
  facebookLeads: FacebookLead[];
  lastUpdated: string;
}

export interface N8NExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'success' | 'error' | 'running';
  startedAt: string;
  finishedAt?: string;
  data: {
    phone?: string;
    callType?: 'inbound' | 'outbound';
    outcome?: string; // booking_link_sent, not_interested, no_answer, voicemail, busy, wrong_number, callback_requested
    leadScore?: number;
    booked?: boolean;
    bookingRequested?: boolean; // From VAPI structured outputs
    isBooked?: boolean; // From GymMaster check
    firstName?: string;
    lastName?: string;
    email?: string;
    linkSent?: boolean;
    callSummary?: string;
    interestLevel?: string; // From VAPI structured outputs
    serviceInterest?: string; // From VAPI structured outputs
  };
}

export interface VAPICall {
  id: string;
  type: 'inbound' | 'outbound';
  phoneNumber: string;
  duration: number;
  status: 'completed' | 'failed' | 'no-answer' | 'voicemail';
  outcome?: string; // booking_link_sent, not_interested, no_answer, voicemail, busy, wrong_number, callback_requested
  startedAt: string;
  endedAt?: string;
  leadName?: string;
  summary?: string; // Call summary from VAPI artifact
}

export interface FacebookLead {
  id: string;
  formId: string;
  formName?: string;
  createdTime: string;
  name: string;
  email?: string;
  phone?: string;
  adId?: string;
  adName?: string;
  status: 'new' | 'contacted' | 'qualified' | 'booked' | 'not_interested';
  source: 'facebook_ad' | 'facebook_page';
  customFields?: Record<string, string>;

  // Journey tracking fields
  journey?: {
    // Pipeline stage tracking
    pipelineStage?: PipelineStage;  // Current stage in the pipeline
    stageUpdatedAt?: string;        // When the stage was last updated

    // Contact method: instant call or queued
    contactMethod?: 'instant' | 'queued';
    contactedAt?: string;           // When the lead was first contacted
    queuedAt?: string;              // When the lead was added to queue (if queued)

    // Callback tracking
    callbackRequested?: boolean;
    callbackScheduledAt?: string;   // When the callback is scheduled
    callbackReason?: string;        // Why callback was requested
    callbackCompleted?: boolean;    // Whether callback was completed

    // Call outcome
    callOutcome?: 'booking_link_sent' | 'no_answer' | 'voicemail' | 'not_interested' | 'callback_requested' | 'busy' | 'wrong_number' | 'completed' | string;
    callSummary?: string;           // AI-generated call summary
    callDuration?: number;          // Duration in seconds
    vapiCallId?: string;            // VAPI call ID for reference

    // Final booking status (from GymMaster)
    gymMasterChecked?: boolean;     // Whether GymMaster was checked
    isBooked?: boolean;             // Final booking status from GymMaster
    isMember?: boolean;             // Whether they're already a member
    memberId?: string;              // GymMaster member ID if exists
    bookingDetails?: {              // Details of upcoming bookings
      day: string;
      startTime: string;
      serviceName: string;
    }[];

    // Attempt tracking
    totalAttempts?: number;         // Total call attempts
    lastAttemptAt?: string;         // Time of last attempt
  };
}
