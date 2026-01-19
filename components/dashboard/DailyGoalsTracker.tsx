import { DailyGoal } from '@/types/gamification';

interface DailyGoalsTrackerProps {
  goals: DailyGoal[];
}

export default function DailyGoalsTracker({ goals }: DailyGoalsTrackerProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
        Daily Goals
      </h3>

      {goals.map((goal) => {
        const progress = Math.min(100, (goal.current / goal.target) * 100);
        const remaining = Math.max(0, goal.target - goal.current);
        const isComplete = goal.current >= goal.target;

        return (
          <div key={goal.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {goal.name}
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                {goal.current}/{goal.target}
              </span>
            </div>

            <div className="relative">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isComplete
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {isComplete ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Goal complete! 🎉
                  </span>
                ) : (
                  `${remaining} more to go`
                )}
              </span>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {progress.toFixed(0)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
