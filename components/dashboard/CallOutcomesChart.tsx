'use client';

import { CallOutcome } from '@/types/analytics';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface CallOutcomesChartProps {
  data: CallOutcome[];
}

const COLORS: Record<string, string> = {
  booked: '#16a34a', // bright green for GymMaster confirmed bookings
  linkSent: '#8b5cf6', // purple for booking link sent (interested but not confirmed)
  noAnswer: '#FB8C00', // wellness warning orange
  voicemail: '#0288D1', // wellness blue
  notInterested: '#ef4444', // red
  other: '#9ca3af', // gray
};

const LABELS: Record<string, string> = {
  booked: 'Booked (GymMaster)', // Actually booked in GymMaster (is_booked === true)
  linkSent: 'Link Sent',        // booking_link_sent = lead interested, link sent (not confirmed)
  noAnswer: 'No Answer',
  voicemail: 'Voicemail',
  notInterested: 'Not Interested',
  other: 'Other',               // includes callback_requested
};

export default function CallOutcomesChart({ data }: CallOutcomesChartProps) {
  // Transform data for pie chart
  const chartData = data.map(item => ({
    name: LABELS[item.type],
    value: item.count,
    percentage: item.percentage,
  }));

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label if slice is too small

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '14px', fontWeight: 600 }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

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
              Call Outcomes
            </h2>
            <p className="text-sm text-white/90 dark:text-wellness-neutral-300 mt-1">
              Distribution of call results
            </p>
          </div>
        </div>
      </div>
      <div className="p-6">

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => {
              const outcomeType = data[index].type;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[outcomeType]}
                />
              );
            })}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
            }}
            formatter={(value: number, name: string) => [
              `${value} calls (${chartData.find(d => d.name === name)?.percentage.toFixed(1)}%)`,
              name,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
