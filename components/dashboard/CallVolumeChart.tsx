'use client';

import { CallVolumeData } from '@/types/analytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CallVolumeChartProps {
  data: CallVolumeData[];
}

export default function CallVolumeChart({ data }: CallVolumeChartProps) {
  // Format hour for display (e.g., 9 -> "9 AM", 14 -> "2 PM")
  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  // Transform data for chart display
  const chartData = data.map(item => ({
    ...item,
    hourLabel: formatHour(item.hour),
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-wellness-neutral-300/30 dark:border-wellness-700/30 shadow-premium-lg hover-lift backdrop-blur-sm overflow-hidden">
      <div className="p-6 border-b border-wellness-neutral-300 dark:border-wellness-700 bg-gradient-to-r from-[#B44C45] via-[#D4A59A] to-[#ECE3DC] dark:from-wellness-900 dark:via-wellness-700 dark:to-wellness-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-wellness-900 dark:bg-wellness-600 flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white dark:text-wellness-neutral-100">
              Call Volume by Hour
            </h2>
            <p className="text-sm text-white/90 dark:text-wellness-neutral-300 mt-1">
              Inbound vs Outbound calls throughout the day
            </p>
          </div>
        </div>
      </div>
      <div className="p-6">

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          <XAxis
            dataKey="hourLabel"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
            }}
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
          />
          <Bar
            dataKey="inbound"
            fill="#00897B"
            name="Inbound"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="outbound"
            fill="#0288D1"
            name="Outbound"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
