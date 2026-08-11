'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Briefcase, Building2, Clock, DollarSign, Loader2, TrendingUp, Users } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Placement {
  id: string;
  studentName: string;
  programName: string;
  employerName: string;
  position: string;
  salary: number;
  startDate: string | null;
  status: string;
  createdAt: string;
}

export function JobPlacementTracking({ programId }: { programId?: string; showPipeline?: boolean }) {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      let query = supabase
        .from('job_placements')
        .select(`
          id, program_id, position, salary, start_date, status, created_at,
          profiles!job_placements_student_id_fkey(full_name),
          training_programs(name),
          employer_profiles(company_name)
        `)
        .order('created_at', { ascending: false });
      if (programId) query = query.eq('program_id', programId);
      const { data, error: queryError } = await query;
      if (queryError) throw queryError;

      setPlacements((data ?? []).map((row: any) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        const program = Array.isArray(row.training_programs) ? row.training_programs[0] : row.training_programs;
        const employer = Array.isArray(row.employer_profiles) ? row.employer_profiles[0] : row.employer_profiles;
        return {
          id: row.id,
          studentName: profile?.full_name || 'Student',
          programName: program?.name || 'Program',
          employerName: employer?.company_name || 'Employer',
          position: row.position || 'Position not recorded',
          salary: Number(row.salary || 0),
          startDate: row.start_date || null,
          status: row.status || 'job_ready',
          createdAt: row.created_at,
        };
      }));
    } catch (loadError) {
      logger.error('[job-placement] failed to load placement data', loadError instanceof Error ? loadError : new Error(String(loadError)));
      setPlacements([]);
      setError('Placement data is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => { void load(); }, [load]);

  const metrics = useMemo(() => {
    const placed = placements.filter((item) => item.status === 'placed');
    const paid = placed.filter((item) => item.salary > 0);
    const avgSalary = paid.length ? Math.round(paid.reduce((sum, item) => sum + item.salary, 0) / paid.length) : 0;
    const employers = new Set(placed.map((item) => item.employerName).filter(Boolean));
    return {
      total: placements.length,
      placed: placed.length,
      placementRate: placements.length ? Math.round((placed.length / placements.length) * 100) : 0,
      avgSalary,
      employers: employers.size,
    };
  }, [placements]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-brand-blue-600" /></div>;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-xl font-black text-slate-950">Job Placement Tracking</h2><p className="text-sm text-slate-600">Live placement records from the workforce database.</p></div>
        <button type="button" onClick={() => void load()} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Refresh</button>
      </div>
      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Pipeline', value: metrics.total, icon: Users },
          { label: 'Placed', value: metrics.placed, icon: Briefcase },
          { label: 'Placement rate', value: `${metrics.placementRate}%`, icon: TrendingUp },
          { label: 'Avg. salary', value: metrics.avgSalary ? `$${metrics.avgSalary.toLocaleString()}` : '—', icon: DollarSign },
          { label: 'Hiring employers', value: metrics.employers, icon: Building2 },
        ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><Icon className="mb-3 h-5 w-5 text-brand-blue-600" /><p className="text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs font-bold text-slate-500">{label}</p></div>)}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4"><h3 className="font-black text-slate-950">Recent placement activity</h3></div>
        {placements.length === 0 ? <p className="p-6 text-sm text-slate-600">No placement records match this view yet.</p> : (
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50"><tr>{['Student','Program','Employer','Position','Status','Start'].map((label) => <th key={label} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">
            {placements.slice(0, 25).map((placement) => <tr key={placement.id}><td className="px-4 py-3 font-bold text-slate-900">{placement.studentName}</td><td className="px-4 py-3 text-slate-700">{placement.programName}</td><td className="px-4 py-3 text-slate-700">{placement.employerName}</td><td className="px-4 py-3 text-slate-700">{placement.position}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{placement.status.replaceAll('_',' ')}</span></td><td className="px-4 py-3 text-slate-600"><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{placement.startDate ? new Date(placement.startDate).toLocaleDateString() : '—'}</span></td></tr>)}
          </tbody></table></div>
        )}
      </div>
    </section>
  );
}
