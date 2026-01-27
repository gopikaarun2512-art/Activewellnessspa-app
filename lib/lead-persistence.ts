/**
 * Lead Persistence Layer
 * Stores historical lead data in localStorage for persistence across sessions
 */

import { FacebookLead, PipelineStage } from '@/types/analytics';

const STORAGE_KEY = 'aws_lead_history';
const MAX_AGE_DAYS = 30;

export interface PersistedLead {
  id: string;
  phone: string;
  name: string;
  email?: string;
  pipelineStage: PipelineStage;
  status: FacebookLead['status'];
  journey: FacebookLead['journey'];
  createdTime: string;
  firstSeen: string;
  lastUpdated: string;
  formName?: string;
  adName?: string;
  source: FacebookLead['source'];
}

interface LeadHistory {
  leads: PersistedLead[];
  lastSaved: string;
  version: number;
}

const CURRENT_VERSION = 1;

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * Get stored lead history from localStorage
 */
function getStoredHistory(): LeadHistory | null {
  if (!isBrowser()) return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const history: LeadHistory = JSON.parse(stored);

    // Version migration if needed
    if (history.version !== CURRENT_VERSION) {
      console.log('[LeadPersistence] Migrating from version', history.version, 'to', CURRENT_VERSION);
      history.version = CURRENT_VERSION;
    }

    return history;
  } catch (error) {
    console.error('[LeadPersistence] Error reading from localStorage:', error);
    return null;
  }
}

/**
 * Save lead history to localStorage
 */
function saveHistory(history: LeadHistory): void {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('[LeadPersistence] Error saving to localStorage:', error);

    // If storage is full, try to prune old entries and retry
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.log('[LeadPersistence] Storage full, pruning old entries');
      pruneOldEntries(7); // More aggressive pruning
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      } catch (retryError) {
        console.error('[LeadPersistence] Still failed after pruning:', retryError);
      }
    }
  }
}

/**
 * Convert a FacebookLead to a PersistedLead
 */
function toPersistedLead(lead: FacebookLead, existingFirstSeen?: string): PersistedLead {
  return {
    id: lead.id,
    phone: lead.phone || '',
    name: lead.name,
    email: lead.email,
    pipelineStage: lead.journey?.pipelineStage || 'lead_submitted',
    status: lead.status,
    journey: lead.journey,
    createdTime: lead.createdTime,
    firstSeen: existingFirstSeen || new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    formName: lead.formName,
    adName: lead.adName,
    source: lead.source,
  };
}

/**
 * Convert a PersistedLead back to a FacebookLead
 */
function toFacebookLead(persisted: PersistedLead): FacebookLead {
  return {
    id: persisted.id,
    formId: persisted.id, // Use id as fallback
    formName: persisted.formName,
    createdTime: persisted.createdTime,
    name: persisted.name,
    email: persisted.email,
    phone: persisted.phone,
    status: persisted.status,
    source: persisted.source,
    adName: persisted.adName,
    journey: persisted.journey,
  };
}

/**
 * Save leads to localStorage
 * Merges with existing data, keeping the most recent version of each lead
 */
export function saveLeads(leads: FacebookLead[]): void {
  if (!isBrowser() || leads.length === 0) return;

  const history = getStoredHistory() || {
    leads: [],
    lastSaved: new Date().toISOString(),
    version: CURRENT_VERSION,
  };

  // Create a map of existing leads by ID for quick lookup
  const existingLeadsMap = new Map<string, PersistedLead>();
  history.leads.forEach(lead => existingLeadsMap.set(lead.id, lead));

  // Update or add new leads
  leads.forEach(lead => {
    const existing = existingLeadsMap.get(lead.id);
    const persisted = toPersistedLead(lead, existing?.firstSeen);
    existingLeadsMap.set(lead.id, persisted);
  });

  // Convert map back to array
  history.leads = Array.from(existingLeadsMap.values());
  history.lastSaved = new Date().toISOString();

  // Prune old entries before saving
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_AGE_DAYS);
  history.leads = history.leads.filter(lead => {
    const leadDate = new Date(lead.createdTime);
    return leadDate >= cutoffDate;
  });

  saveHistory(history);
  console.log(`[LeadPersistence] Saved ${history.leads.length} leads to localStorage`);
}

/**
 * Get historical leads from localStorage
 * @param days Number of days of history to retrieve (default: 30)
 */
export function getHistoricalLeads(days: number = MAX_AGE_DAYS): PersistedLead[] {
  if (!isBrowser()) return [];

  const history = getStoredHistory();
  if (!history) return [];

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return history.leads.filter(lead => {
    const leadDate = new Date(lead.createdTime);
    return leadDate >= cutoffDate;
  });
}

/**
 * Merge real-time leads with historical data
 * Real-time data takes precedence for matching IDs
 */
export function mergeWithRealtime(realtimeLeads: FacebookLead[]): FacebookLead[] {
  if (!isBrowser()) return realtimeLeads;

  const historical = getHistoricalLeads();
  if (historical.length === 0) return realtimeLeads;

  // Create a map of real-time leads by ID
  const realtimeMap = new Map<string, FacebookLead>();
  realtimeLeads.forEach(lead => realtimeMap.set(lead.id, lead));

  // Add historical leads that aren't in real-time
  // (e.g., leads from previous days when viewing "today" only)
  const merged: FacebookLead[] = [...realtimeLeads];

  historical.forEach(persisted => {
    if (!realtimeMap.has(persisted.id)) {
      merged.push(toFacebookLead(persisted));
    }
  });

  return merged;
}

/**
 * Get leads by pipeline stage from history
 */
export function getLeadsByStage(stage: PipelineStage): PersistedLead[] {
  const historical = getHistoricalLeads();
  return historical.filter(lead => lead.pipelineStage === stage);
}

/**
 * Get pipeline summary from historical data
 */
export function getHistoricalPipelineSummary(): {
  totalLeads: number;
  byStage: Record<PipelineStage, number>;
} {
  const historical = getHistoricalLeads();

  const byStage: Record<PipelineStage, number> = {
    'lead_submitted': 0,
    'call_pending': 0,
    'call_completed': 0,
    'booking_confirmed': 0,
  };

  historical.forEach(lead => {
    byStage[lead.pipelineStage]++;
  });

  return {
    totalLeads: historical.length,
    byStage,
  };
}

/**
 * Prune old entries from localStorage
 * @param maxDays Maximum age of entries to keep
 */
export function pruneOldEntries(maxDays: number = MAX_AGE_DAYS): void {
  if (!isBrowser()) return;

  const history = getStoredHistory();
  if (!history) return;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxDays);

  const originalCount = history.leads.length;
  history.leads = history.leads.filter(lead => {
    const leadDate = new Date(lead.createdTime);
    return leadDate >= cutoffDate;
  });

  const prunedCount = originalCount - history.leads.length;
  if (prunedCount > 0) {
    console.log(`[LeadPersistence] Pruned ${prunedCount} old entries`);
    saveHistory(history);
  }
}

/**
 * Clear all stored lead history
 */
export function clearHistory(): void {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[LeadPersistence] Cleared all lead history');
  } catch (error) {
    console.error('[LeadPersistence] Error clearing history:', error);
  }
}

/**
 * Get storage stats
 */
export function getStorageStats(): {
  leadCount: number;
  oldestLead: string | null;
  newestLead: string | null;
  lastSaved: string | null;
  storageSizeKB: number;
} {
  if (!isBrowser()) {
    return {
      leadCount: 0,
      oldestLead: null,
      newestLead: null,
      lastSaved: null,
      storageSizeKB: 0,
    };
  }

  const history = getStoredHistory();
  if (!history || history.leads.length === 0) {
    return {
      leadCount: 0,
      oldestLead: null,
      newestLead: null,
      lastSaved: history?.lastSaved || null,
      storageSizeKB: 0,
    };
  }

  // Sort by created time
  const sorted = [...history.leads].sort(
    (a, b) => new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime()
  );

  // Estimate storage size
  const stored = localStorage.getItem(STORAGE_KEY) || '';
  const sizeBytes = new Blob([stored]).size;

  return {
    leadCount: history.leads.length,
    oldestLead: sorted[0]?.createdTime || null,
    newestLead: sorted[sorted.length - 1]?.createdTime || null,
    lastSaved: history.lastSaved,
    storageSizeKB: Math.round(sizeBytes / 1024),
  };
}

// Export a convenience object with all functions
export const leadPersistence = {
  saveLeads,
  getHistoricalLeads,
  mergeWithRealtime,
  getLeadsByStage,
  getHistoricalPipelineSummary,
  pruneOldEntries,
  clearHistory,
  getStorageStats,
};
