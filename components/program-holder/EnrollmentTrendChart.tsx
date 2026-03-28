'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  /** Array of { month: 'YYYY-MM', count: number } sorted ascending */
  data: { month: string; count: number }[];
}

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MONTH_SHORT[parseInt(m, 10) - 1]} '${y.slice(2)}`;
}

export function EnrollmentTrendChart({ data }: Props) {
  const chartData = useMemo(
    () => data.map((d) => ({ month: formatMonth(d.month), enrollments: d.count })),
    [data],
  );

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No enrollment data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="enrollGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
          labelStyle={{ fontWeight: 600, color: '#1e293b' }}
          formatter={(value: number) => [value, 'Enrollments']}
        />
        <Area
          type="monotone"
          dataKey="enrollments"
          stroke="#f97316"
          strokeWidth={2}
          fill="url(#enrollGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#f97316' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
