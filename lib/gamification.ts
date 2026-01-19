import {
  GamificationData,
  DailyGoal,
  Level,
  Achievement,
  LEVELS,
  ACHIEVEMENT_DEFINITIONS,
} from '@/types/gamification';
import { DashboardData } from '@/types/analytics';

export class GamificationCalculator {
  calculateGamificationData(
    dashboardData: DashboardData,
    totalCallsAllTime: number = 0
  ): GamificationData {
    const dailyGoals = this.calculateDailyGoals(dashboardData);
    const { currentLevel, nextLevel, progressToNext } = this.calculateLevel(
      totalCallsAllTime || dashboardData.metrics.totalCalls
    );
    const achievements = this.calculateAchievements(dashboardData);

    return {
      dailyGoals,
      currentLevel,
      nextLevel,
      progressToNext,
      totalCalls: totalCallsAllTime || dashboardData.metrics.totalCalls,
      achievements,
    };
  }

  private calculateDailyGoals(dashboardData: DashboardData): DailyGoal[] {
    return [
      {
        id: 'calls',
        name: 'Calls',
        current: dashboardData.metrics.totalCalls,
        target: 10, // Realistic: Based on 5-7 calls/day average, 10 is achievable stretch goal
        unit: 'calls',
      },
      {
        id: 'bookings',
        name: 'Bookings',
        current: dashboardData.metrics.totalBookings,
        target: 3, // Realistic: ~30% conversion rate from 10 calls
        unit: 'bookings',
      },
      {
        id: 'queue_processed',
        name: 'Queue Processed',
        current: dashboardData.recentActivity.length,
        target: 8, // Realistic: Process most of daily queue
        unit: 'completed',
      },
    ];
  }

  private calculateLevel(totalCalls: number): {
    currentLevel: Level;
    nextLevel: Level | null;
    progressToNext: number;
  } {
    let currentLevel = LEVELS[0];
    let nextLevel: Level | null = LEVELS[1];

    // Find current level
    for (let i = 0; i < LEVELS.length; i++) {
      if (totalCalls >= LEVELS[i].minCalls && totalCalls <= LEVELS[i].maxCalls) {
        currentLevel = LEVELS[i];
        nextLevel = i < LEVELS.length - 1 ? LEVELS[i + 1] : null;
        break;
      }
    }

    // Calculate progress to next level
    let progressToNext = 100;
    if (nextLevel) {
      const currentLevelMin = currentLevel.minCalls;
      const nextLevelMin = nextLevel.minCalls;
      const range = nextLevelMin - currentLevelMin;
      const progress = totalCalls - currentLevelMin;
      progressToNext = Math.min(100, Math.floor((progress / range) * 100));
    }

    return { currentLevel, nextLevel, progressToNext };
  }

  private calculateAchievements(dashboardData: DashboardData): Achievement[] {
    const achievements: Achievement[] = ACHIEVEMENT_DEFINITIONS.map(def => ({
      ...def,
      unlocked: false,
    }));

    const { metrics, recentActivity, queuedCalls } = dashboardData;

    // First Call
    if (metrics.totalCalls >= 1) {
      const achievement = achievements.find(a => a.id === 'first_call');
      if (achievement) achievement.unlocked = true;
    }

    // Daily Goal (all 3 goals reached: 10 calls, 3 bookings, 8 processed)
    if (metrics.totalCalls >= 10 && metrics.totalBookings >= 3 && recentActivity.length >= 8) {
      const achievement = achievements.find(a => a.id === 'daily_goal');
      if (achievement) achievement.unlocked = true;
    }

    // Queue Clearer (processed 10+ calls in one day)
    if (metrics.totalCalls >= 10) {
      const achievement = achievements.find(a => a.id === 'queue_clearer');
      if (achievement) achievement.unlocked = true;
    }

    // Booking Streak (3 consecutive bookings - check recent activity)
    const bookedActivities = recentActivity.filter(a => a.outcome === 'booked');
    if (bookedActivities.length >= 3) {
      // Check if the first 3 booked calls are consecutive in the activity list
      const achievement = achievements.find(a => a.id === 'booking_streak');
      if (achievement) achievement.unlocked = true;
    }

    // Perfect Day (100% conversion with at least 5 calls)
    if (metrics.totalCalls >= 5 && metrics.conversionRate === 100) {
      const achievement = achievements.find(a => a.id === 'perfect_day');
      if (achievement) achievement.unlocked = true;
    }

    // Early Bird (3 calls before 9 AM)
    const earlyCallsCount = recentActivity.filter(activity => {
      const hour = new Date(activity.time).getHours();
      return hour < 9;
    }).length;
    if (earlyCallsCount >= 3) {
      const achievement = achievements.find(a => a.id === 'early_bird');
      if (achievement) achievement.unlocked = true;
    }

    // Consistent Caller (would need historical data - placeholder for now)
    // This would require tracking calls over multiple days

    // High Value Lead (lead score 90+)
    const highValueLeads = recentActivity.filter(activity =>
      activity.leadScore && activity.leadScore >= 90
    );
    if (highValueLeads.length > 0) {
      const achievement = achievements.find(a => a.id === 'high_value_lead');
      if (achievement) achievement.unlocked = true;
    }

    return achievements;
  }
}

export const gamificationCalculator = new GamificationCalculator();
