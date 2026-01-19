import { Activity, FacebookLead, QueuedCall } from '@/types/analytics';
import { format } from 'date-fns';

export function exportActivityToCSV(activities: Activity[], filename: string = 'call-activity.csv') {
  const headers = [
    'Time',
    'Type',
    'Lead Name',
    'Phone',
    'Email',
    'Outcome',
    'Lead Score',
    'Link Sent',
    'Call Summary',
  ];

  const rows = activities.map(activity => [
    format(new Date(activity.time), 'yyyy-MM-dd HH:mm:ss'),
    activity.type,
    activity.leadName,
    activity.phone,
    activity.email || '',
    activity.outcome,
    activity.leadScore?.toString() || '',
    activity.linkSent ? 'Yes' : 'No',
    activity.callSummary ? `"${activity.callSummary.replace(/"/g, '""')}"` : '',
  ]);

  downloadCSV(headers, rows, filename);
}

export function exportFacebookLeadsToCSV(leads: FacebookLead[], filename: string = 'facebook-leads.csv') {
  const headers = [
    'Created Time',
    'Name',
    'Email',
    'Phone',
    'Status',
    'Source',
    'Form Name',
    'Ad Name',
  ];

  const rows = leads.map(lead => [
    format(new Date(lead.createdTime), 'yyyy-MM-dd HH:mm:ss'),
    lead.name,
    lead.email || '',
    lead.phone || '',
    lead.status,
    lead.source,
    lead.formName || '',
    lead.adName || '',
  ]);

  downloadCSV(headers, rows, filename);
}

export function exportQueuedCallsToCSV(calls: QueuedCall[], filename: string = 'queued-calls.csv') {
  const headers = [
    'Queued At',
    'Lead Name',
    'Phone',
    'Type',
    'Priority',
    'Workflow Name',
  ];

  const rows = calls.map(call => [
    format(new Date(call.queuedAt), 'yyyy-MM-dd HH:mm:ss'),
    call.leadName,
    call.phone,
    call.type,
    call.priority || 'medium',
    call.workflowName || '',
  ]);

  downloadCSV(headers, rows, filename);
}

function downloadCSV(headers: string[], rows: string[][], filename: string) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
