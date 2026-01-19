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
}

export interface DashboardData {
  metrics: DashboardMetrics;
  callVolume: CallVolumeData[];
  outcomes: CallOutcome[];
  recentActivity: Activity[];
  queuedCalls: QueuedCall[];
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
}
