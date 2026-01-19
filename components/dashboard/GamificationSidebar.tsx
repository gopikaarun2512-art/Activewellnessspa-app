import { GamificationData } from '@/types/gamification';
import DailyGoalsTracker from './DailyGoalsTracker';
import LevelDisplay from './LevelDisplay';
import AchievementsBadges from './AchievementsBadges';

interface GamificationSidebarProps {
  data: GamificationData;
}

export default function GamificationSidebar({ data }: GamificationSidebarProps) {
  return (
    <div className="sticky top-8 h-[calc(100vh-4rem)] overflow-y-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Your Progress
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Track your daily goals and achievements
        </p>
      </div>

      <div className="h-px bg-gray-200 dark:bg-gray-700" />

      <DailyGoalsTracker goals={data.dailyGoals} />

      <div className="h-px bg-gray-200 dark:bg-gray-700" />

      <LevelDisplay
        currentLevel={data.currentLevel}
        nextLevel={data.nextLevel}
        progressToNext={data.progressToNext}
        totalCalls={data.totalCalls}
      />

      <div className="h-px bg-gray-200 dark:bg-gray-700" />

      <AchievementsBadges achievements={data.achievements} />
    </div>
  );
}
