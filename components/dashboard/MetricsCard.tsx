interface MetricsCardProps {
  title: string;
  value: number | string;
  trend?: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
  suffix?: string;
}

export default function MetricsCard({
  title,
  value,
  trend,
  icon,
  color,
  suffix = '',
}: MetricsCardProps) {
  const colorClasses = {
    blue: 'bg-wellness-blue-50 dark:bg-wellness-blue-950/30 text-wellness-blue-600 dark:text-wellness-blue-400',
    green: 'bg-wellness-success-50 dark:bg-wellness-success-950/30 text-wellness-success-600 dark:text-wellness-success-400',
    purple: 'bg-wellness-100 dark:bg-wellness-950/30 text-wellness-600 dark:text-wellness-400',
    orange: 'bg-wellness-warning-50 dark:bg-wellness-warning-950/30 text-wellness-warning-600 dark:text-wellness-warning-400',
  };

  const trendColor = trend && trend >= 0
    ? 'text-wellness-success-600 dark:text-wellness-success-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-lg hover:border-wellness-500 dark:hover:border-wellness-600 group">
      <div className="flex items-start gap-4">
        {/* Icon first - larger and more prominent */}
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${colorClasses[color]}`}>
          {icon}
        </div>

        {/* Content stack */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300 mb-2">
            {title}
          </p>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-4xl font-bold text-gray-900 dark:text-white tabular-nums">
              {typeof value === 'number' ? value.toLocaleString() : value}
              {suffix && <span className="text-2xl ml-1 text-gray-600 dark:text-gray-300">{suffix}</span>}
            </h3>
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1.5 text-sm font-semibold ${trendColor}`}>
              {trend >= 0 ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
