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
  type: 'booked' | 'noAnswer' | 'voicemail' | 'notInterested' | 'other';
  count: number;
  percentage: number;
}

export interface Activity {
  id: string;
  time: string;
  type: 'inbound' | 'outbound';
  phone: string;
  leadName: string;
  outcome: 'booked' | 'noAnswer' | 'voicemail' | 'notInterested' | 'other';
  leadScore?: number;
  email?: string;
  linkSent?: boolean;
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
    outcome?: string;
    leadScore?: number;
    booked?: boolean;
    firstName?: string;
    lastName?: string;
    email?: string;
    linkSent?: boolean;
    callSummary?: string;
  };
}

export interface VAPICall {
  id: string;
  type: 'inbound' | 'outbound';
  phoneNumber: string;
  duration: number;
  status: 'completed' | 'failed' | 'no-answer' | 'voicemail';
  outcome?: string;
  startedAt: string;
  endedAt?: string;
  leadName?: string;
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
