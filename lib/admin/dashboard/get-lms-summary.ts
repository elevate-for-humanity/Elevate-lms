import type { SupabaseClient } from '@supabase/supabase-js';

export interface DashboardLms {
  activeLearners: number;
  avgProgressPercent: number;
  inactiveOver7Days: number;
  completionReadyCount: number;
}

export async function getLmsSummary(db: SupabaseClient): Promise<DashboardLms> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [active, progress, inactive, ready] = await Promise.all([
    db.from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),

    db.from('program_enrollments')
      .select('progress_percent')
      .eq('status', 'active'),

    db.from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .lt('updated_at', sevenDaysAgo),

    db.from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('progress_percent', 90),
  ]);

  const rows = (progress.data ?? []) as { progress_percent: number | null }[];
  const avg = rows.length
    ? Math.round(rows.reduce((s, r) => s + (r.progress_percent ?? 0), 0) / rows.length)
    : 0;

  return {
    activeLearners:       active.count  ?? 0,
    avgProgressPercent:   avg,
    inactiveOver7Days:    inactive.count ?? 0,
    completionReadyCount: ready.count   ?? 0,
  };
}
