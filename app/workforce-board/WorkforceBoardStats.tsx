'use client';

import { useEffect, useState } from 'react';
import { Users, TrendingUp, Briefcase, Award } from 'lucide-react';

interface Stats {
  total_participants?: number;
  employment_rate?: number;
  avg_wage?: number;
  completions?: number;
}

export function WorkforceBoardStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/workforce-board/performance-trends')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        // Normalize — route may return trends array or summary object
        const summary = data.summary ?? data.trends?.[0] ?? data;
        setStats({
          total_participants: summary.total_participants ?? summary.participants ?? data.total_participants,
          employment_rate: summary.employment_rate ?? summary.placement_rate,
          avg_wage: summary.avg_wage ?? summary.average_wage,
          completions: summary.completions ?? summary.total_completions,
        });
      })
      .catch(() => {}); // fail silently — stats strip is non-critical
  }, []);

  if (!stats) return null;

  const items = [
    { label: 'Participants', value: stats.total_participants?.toLocaleString() ?? '—', icon: Users, color: 'text-brand-blue-600', bg: 'bg-brand-blue-50' },
    { label: 'Employment Rate', value: stats.employment_rate != null ? `${stats.employment_rate}%` : '—', icon: TrendingUp, color: 'text-brand-green-600', bg: 'bg-brand-green-50' },
    { label: 'Avg. Wage', value: stats.avg_wage != null ? `$${stats.avg_wage.toLocaleString()}` : '—', icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completions', value: stats.completions?.toLocaleString() ?? '—', icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-8">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
            <div className={`w-9 h-9 ${item.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <p className="text-xl font-bold text-slate-900">{item.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}
