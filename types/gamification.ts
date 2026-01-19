export interface DailyGoal {
  id: string;
  name: string;
  current: number;
  target: number;
  unit: string;
}

export interface Level {
  id: number;
  name: string;
  icon: string;
  minCalls: number;
  maxCalls: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  requirement: string;
}

export interface GamificationData {
  dailyGoals: DailyGoal[];
  currentLevel: Level;
  nextLevel: Level | null;
  progressToNext: number; // percentage
  totalCalls: number;
  achievements: Achievement[];
}

export const LEVELS: Level[] = [
  { id: 1, name: 'Beginner', icon: '🌱', minCalls: 0, maxCalls: 20 }, // First week
  { id: 2, name: 'Rising Star', icon: '⭐', minCalls: 21, maxCalls: 50 }, // ~1 month
  { id: 3, name: 'Professional', icon: '💼', minCalls: 51, maxCalls: 100 }, // ~2-3 months
  { id: 4, name: 'Expert', icon: '🏆', minCalls: 101, maxCalls: 200 }, // ~6 months
  { id: 5, name: 'Master', icon: '👑', minCalls: 201, maxCalls: Infinity }, // 6+ months
];

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  {
    id: 'first_call',
    name: 'First Call',
    description: 'Made your first call',
    icon: '📞',
    requirement: '1 call',
  },
  {
    id: 'daily_goal',
    name: 'Daily Goal',
    description: 'Completed all daily goals in one day',
    icon: '🎯',
    requirement: 'Complete all 3 daily goals',
  },
  {
    id: 'queue_clearer',
    name: 'Queue Clearer',
    description: 'Processed entire daily queue',
    icon: '✅',
    requirement: 'Process 10+ calls in one day',
  },
  {
    id: 'booking_streak',
    name: 'Booking Streak',
    description: 'Got 3 bookings in a row',
    icon: '🔥',
    requirement: '3 consecutive bookings',
  },
  {
    id: 'perfect_day',
    name: 'Perfect Day',
    description: '100% conversion rate with at least 5 calls',
    icon: '💯',
    requirement: '100% conversion (min 5 calls)',
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Made 3 calls before 9 AM',
    icon: '🌅',
    requirement: '3 calls before 9 AM',
  },
  {
    id: 'consistent_caller',
    name: 'Consistent Caller',
    description: 'Made at least 5 calls every day for a week',
    icon: '📅',
    requirement: '5+ calls daily for 7 days',
  },
  {
    id: 'high_value_lead',
    name: 'High Value Lead',
    description: 'Contacted a lead with excellent engagement',
    icon: '💎',
    requirement: 'Lead score 90+',
  },
];
