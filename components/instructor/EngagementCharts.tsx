'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useMemo } from 'react';

type Enrollment = { id: string; created_at: string; user_id: string };
type Certificate = { id: string; created_at: string; user_id: string };

export function EngagementCharts({
  courseId,
  enrollments,
  certificates,
}: {
  courseId: string;
  enrollments: Enrollment[];
  certificates: Certificate[];
}) {
  // Aggregate by day
  const data = useMemo(() => {
    const map = new Map<string, { date: string; enrollments: number; completions: number }>();

    function add(mapKey: string, key: 'enrollments' | 'completions') {
      const existing = map.get(mapKey) || {
        date: mapKey,
        enrollments: 0,
        completions: 0,
      };
      existing[key] += 1;
      map.set(mapKey, existing);
    }

    enrollments.forEach((e) => {
      const d = e.created_at.slice(0, 10); // YYYY-MM-DD
      add(d, 'enrollments');
    });

    certificates.forEach((c) => {
      const d = c.created_at.slice(0, 10);
      add(d, 'completions');
    });

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [enrollments, certificates]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Enrollments vs completions over time */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold mb-2">Enrollments vs Certificates (daily)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="enrollments"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="completions"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Completion funnel (bars) */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold mb-2">Completion funnel</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                {
                  label: 'Enrolled',
                  value: enrollments.length,
                },
                {
                  label: 'Completed',
                  value: certificates.length,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
