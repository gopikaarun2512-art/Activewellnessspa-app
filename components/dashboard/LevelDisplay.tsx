import { Level } from '@/types/gamification';

interface LevelDisplayProps {
  currentLevel: Level;
  nextLevel: Level | null;
  progressToNext: number;
  totalCalls: number;
}

export default function LevelDisplay({
  currentLevel,
  nextLevel,
  progressToNext,
  totalCalls,
}: LevelDisplayProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
        Level Progress
      </h3>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">{currentLevel.icon}</div>
          <h4 className="text-lg font-bold text-gray-900 dark:text-white">
            {currentLevel.name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {totalCalls.toLocaleString()} total calls
          </p>
        </div>

        {nextLevel ? (
          <>
            <div className="mb-3">
              <div className="h-3 bg-white dark:bg-gray-800 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">
                {currentLevel.name}
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {progressToNext}%
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {nextLevel.name} {nextLevel.icon}
              </span>
            </div>

            <div className="mt-3 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {nextLevel.minCalls - totalCalls} calls until {nextLevel.name}
              </p>
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
              Max Level Reached! 👑
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
