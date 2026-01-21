import { format, startOfDay, setHours } from 'date-fns';

// AWST is UTC+8 (Australian Western Standard Time)
// AWST does not observe daylight saving time
export const AWST_OFFSET_HOURS = 8;
export const AWST_OFFSET_MS = AWST_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * Get the current hour in AWST (0-23)
 * This is useful for determining if we're before/after noon in AWST
 */
export function getCurrentHourInAWST(): number {
  const now = new Date();
  // Get UTC hours and add AWST offset
  const utcHours = now.getUTCHours();
  const awstHours = (utcHours + AWST_OFFSET_HOURS) % 24;
  return awstHours;
}

/**
 * Get today's date in AWST as components (year, month, day)
 * Useful for date boundary calculations
 */
export function getAWSTDateComponents(): { year: number; month: number; day: number; hour: number } {
  const now = new Date();
  // Create a date string in AWST and parse it
  const awstString = now.toLocaleString('en-AU', { timeZone: 'Australia/Perth' });
  const [datePart, timePart] = awstString.split(', ');
  const [day, month, year] = datePart.split('/').map(Number);
  const [time, period] = timePart.split(' ');
  const [hourStr] = time.split(':');
  let hour = parseInt(hourStr);
  if (period === 'pm' && hour !== 12) hour += 12;
  if (period === 'am' && hour === 12) hour = 0;

  return { year, month, day, hour };
}

/**
 * Convert UTC date to AWST timezone for display purposes
 * Returns a Date object where getHours(), getMinutes() etc return AWST values
 * NOTE: This creates a "fake" date shifted by 8 hours - only use for display!
 */
export function toAWST(date: Date | string): Date {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  // Shift the date forward by 8 hours so local accessors show AWST time
  return new Date(inputDate.getTime() + AWST_OFFSET_MS);
}

/**
 * Convert an AWST display date back to proper UTC
 * Use this when you have a date from toAWST() and need real UTC
 */
export function fromAWSTtoUTC(awstDate: Date): Date {
  return new Date(awstDate.getTime() - AWST_OFFSET_MS);
}

/**
 * Get current date/time in AWST timezone (for display)
 * NOTE: This returns a shifted date - only use for display purposes!
 */
export function getNowInAWST(): Date {
  return toAWST(new Date());
}

/**
 * Get current time as UTC Date object
 * Use this for API calls that need proper UTC timestamps
 */
export function getNowUTC(): Date {
  return new Date();
}

/**
 * Format a date in AWST timezone
 */
export function formatInAWST(date: Date | string, formatStr: string): string {
  const awstDate = toAWST(date);
  return format(awstDate, formatStr);
}

/**
 * Check if it's past the daily reset time (12:00 PM AWST)
 */
export function isPastDailyReset(): boolean {
  const nowInAWST = getNowInAWST();
  const currentHour = nowInAWST.getHours();
  return currentHour >= 12;
}

/**
 * Get the daily reset timestamp for today (12:00 PM AWST)
 * Returns ISO string in UTC
 */
export function getDailyResetTimestamp(): string {
  const nowInAWST = getNowInAWST();
  const resetTimeAWST = setHours(startOfDay(nowInAWST), 12);
  // Convert back to UTC
  const utcTime = resetTimeAWST.getTime() - (AWST_OFFSET_HOURS * 3600000);
  return new Date(utcTime).toISOString();
}

/**
 * Get today's date string in AWST (YYYY-MM-DD)
 */
export function getTodayInAWST(): string {
  return format(getNowInAWST(), 'yyyy-MM-dd');
}

/**
 * Check if data should be reset based on last reset date
 * Reset happens at 12:00 PM AWST daily
 */
export function shouldResetData(lastResetDate: string | null): boolean {
  if (!lastResetDate) return true;

  const nowInAWST = getNowInAWST();
  const today = format(nowInAWST, 'yyyy-MM-dd');
  const currentHour = nowInAWST.getHours();

  // If it's a new day and past noon, reset
  if (lastResetDate < today && currentHour >= 12) {
    return true;
  }

  // If same day, already reset today
  if (lastResetDate === today) {
    return false;
  }

  return currentHour >= 12;
}

/**
 * Format time for display (e.g., "3:45 PM AWST")
 */
export function formatTimeAWST(date: Date | string): string {
  return formatInAWST(date, 'h:mm a') + ' AWST';
}

/**
 * Format date for display (e.g., "Monday, January 20, 2025")
 */
export function formatDateAWST(date: Date | string): string {
  return formatInAWST(date, 'EEEE, MMMM d, yyyy');
}

/**
 * Format short time for display (e.g., "3:45 PM")
 */
export function formatShortTimeAWST(date: Date | string): string {
  return formatInAWST(date, 'h:mm a');
}

/**
 * Format date and time (e.g., "Jan 20, 3:45 PM")
 */
export function formatDateTimeShortAWST(date: Date | string): string {
  return formatInAWST(date, 'MMM d, h:mm a');
}
