'use client';

import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export type DateRange = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom';

interface DateRangeFilterProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange?: (startDate: Date, endDate: Date) => void;
}

export default function DateRangeFilter({
  selectedRange,
  onRangeChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
}: DateRangeFilterProps) {
  const ranges = [
    { value: 'today' as DateRange, label: 'Today', icon: '📅' },
    { value: 'yesterday' as DateRange, label: 'Yesterday', icon: '◀️' },
    { value: 'last7days' as DateRange, label: 'Last 7 Days', icon: '📊' },
    { value: 'last30days' as DateRange, label: 'Last 30 Days', icon: '📈' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onRangeChange(range.value)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${selectedRange === range.value
              ? 'bg-white text-wellness-900 shadow-md border-2 border-wellness-500'
              : 'bg-white/40 text-white hover:bg-white/60 border-2 border-white/30'
            }
          `}
        >
          <span>{range.icon}</span>
          <span>{range.label}</span>
        </button>
      ))}
    </div>
  );
}

export function getDateRangeFromFilter(range: DateRange): { startDate: Date; endDate: Date } {
  const now = new Date();

  switch (range) {
    case 'today':
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now),
      };
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday),
      };
    case 'last7days':
      return {
        startDate: startOfDay(subDays(now, 6)),
        endDate: endOfDay(now),
      };
    case 'last30days':
      return {
        startDate: startOfDay(subDays(now, 29)),
        endDate: endOfDay(now),
      };
    default:
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now),
      };
  }
}
