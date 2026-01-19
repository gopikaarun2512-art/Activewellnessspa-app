import { Achievement } from '@/types/gamification';

interface AchievementsBadgesProps {
  achievements: Achievement[];
}

export default function AchievementsBadges({ achievements }: AchievementsBadgesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
          Achievements
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {achievements.filter(a => a.unlocked).length}/{achievements.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`relative p-3 rounded-lg border transition-all duration-200 ${
              achievement.unlocked
                ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-300 dark:border-yellow-800 shadow-sm'
                : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 opacity-60'
            }`}
          >
            {achievement.unlocked && (
              <div className="absolute top-1 right-1">
                <svg
                  className="w-4 h-4 text-green-600 dark:text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}

            <div className="text-center">
              <div className="text-2xl mb-1">
                {achievement.unlocked ? achievement.icon : '🔒'}
              </div>
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                {achievement.name}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                {achievement.description}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {achievement.requirement}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
