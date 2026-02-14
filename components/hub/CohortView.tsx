'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, TrendingUp, AlertTriangle, CheckCircle, ChevronDown } from 'lucide-react';

interface CohortStats {
  id: string;
  name: string;
  type: 'program' | 'funding' | 'start_date';
  total: number;
  on_track: number;
  at_risk: number;
  completed: number;
  avg_progress: number;
}

export default function CohortView({ showBy = 'program' }: { showBy?: 'program' | 'funding' | 'start_date' }) {
  const [cohorts, setCohorts] = useState<CohortStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState(showBy);

  useEffect(() => {
    async function fetchCohorts() {
      setLoading(true);
      const supabase = createClient();

      if (groupBy === 'program') {
        // Group by program
        const { data: programs } = await supabase
          .from('programs')
          .select('id, name');

        if (programs) {
          const cohortData: CohortStats[] = [];

          for (const program of programs) {
            const { data: enrollments } = await supabase
              .from('enrollments')
              .select('id, status, progress')
              .eq('program_id', program.id);

            if (enrollments && enrollments.length > 0) {
              const total = enrollments.length;
              const completed = enrollments.filter((e: any) => e.progress >= 100).length;
              const atRisk = enrollments.filter((e: any) => e.status === 'at_risk' || (e.progress < 25 && e.progress > 0)).length;
              const onTrack = total - completed - atRisk;
              const avgProgress = Math.round(
                enrollments.reduce((sum: number, e: any) => sum + (e.progress || 0), 0) / total
              );

              cohortData.push({
                id: program.id,
                name: program.name,
                type: 'program',
                total,
                on_track: onTrack,
                at_risk: atRisk,
                completed,
                avg_progress: avgProgress,
              });
            }
          }

          setCohorts(cohortData.sort((a, b) => b.total - a.total));
        }
      } else if (groupBy === 'funding') {
        // Group by funding source
        const { data: enrollments } = await supabase
          .from('program_enrollments')
          .select('id, funding_source, status');

        if (enrollments) {
          const fundingMap: Record<string, any[]> = {};
          enrollments.forEach((e: any) => {
            const source = e.funding_source || 'Self-Pay';
            if (!fundingMap[source]) fundingMap[source] = [];
            fundingMap[source].push(e);
          });

          const cohortData: CohortStats[] = Object.entries(fundingMap).map(([source, items]) => {
            const total = items.length;
            const completed = items.filter(e => e.status === 'completed').length;
            const atRisk = items.filter(e => e.status === 'at_risk').length;
            return {
              id: source,
              name: source,
              type: 'funding' as const,
              total,
              on_track: total - completed - atRisk,
              at_risk: atRisk,
              completed,
              avg_progress: 0, // Would need to join with enrollments for progress
            };
          });

          setCohorts(cohortData.sort((a, b) => b.total - a.total));
        }
      } else {
        // Group by start month
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('id, status, progress, created_at');

        if (enrollments) {
          const monthMap: Record<string, any[]> = {};
          enrollments.forEach((e: any) => {
            const date = new Date(e.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            if (!monthMap[monthKey]) monthMap[monthKey] = { name: monthName, items: [] };
            monthMap[monthKey].items.push(e);
          });

          const cohortData: CohortStats[] = Object.entries(monthMap)
            .map(([key, data]: [string, any]) => {
              const items = data.items;
              const total = items.length;
              const completed = items.filter((e: any) => e.progress >= 100).length;
              const atRisk = items.filter((e: any) => e.status === 'at_risk').length;
              const avgProgress = Math.round(
                items.reduce((sum: number, e: any) => sum + (e.progress || 0), 0) / total
              );
              return {
                id: key,
                name: data.name,
                type: 'start_date' as const,
                total,
                on_track: total - completed - atRisk,
                at_risk: atRisk,
                completed,
                avg_progress: avgProgress,
              };
            })
            .sort((a, b) => b.id.localeCompare(a.id));

          setCohorts(cohortData);
        }
      }

      setLoading(false);
    }

    fetchCohorts();
  }, [groupBy]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-blue-500" />
          <h3 className="font-bold text-slate-900">Cohort Overview</h3>
        </div>
        <div className="relative">
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as any)}
            className="appearance-none bg-slate-100 border-0 rounded-lg px-3 py-1.5 pr-8 text-sm font-medium text-slate-700 cursor-pointer focus:ring-2 focus:ring-brand-blue-500"
          >
            <option value="program">By Program</option>
            <option value="funding">By Funding</option>
            <option value="start_date">By Start Date</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {cohorts.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {cohorts.map((cohort) => (
            <div key={cohort.id} className="p-4 hover:bg-slate-50 transition">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-900">{cohort.name}</h4>
                <span className="text-sm text-slate-500">{cohort.total} students</span>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-slate-600">On Track:</span>
                  <span className="font-medium text-slate-900">{cohort.on_track}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-slate-600">At Risk:</span>
                  <span className="font-medium text-slate-900">{cohort.at_risk}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-brand-blue-500"></div>
                  <span className="text-slate-600">Completed:</span>
                  <span className="font-medium text-slate-900">{cohort.completed}</span>
                </div>
              </div>

              {/* Progress Bar */}
              {cohort.avg_progress > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-brand-blue-500 rounded-full"
                      style={{ width: `${(cohort.completed / cohort.total) * 100}%` }}
                    />
                    <div 
                      className="bg-green-500"
                      style={{ width: `${(cohort.on_track / cohort.total) * 100}%` }}
                    />
                    <div 
                      className="bg-amber-500"
                      style={{ width: `${(cohort.at_risk / cohort.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No cohort data available</p>
        </div>
      )}
    </div>
  );
}
