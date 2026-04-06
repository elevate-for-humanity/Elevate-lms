import type { SupabaseClient } from '@supabase/supabase-js';

export interface DashboardPipeline {
  applications: { draft: number; submitted: number; approved: number; rejected: number };
  enrollments:  { enrolled: number; active: number; completed: number; withdrawn: number };
}

export async function getPipelineSummary(db: SupabaseClient): Promise<DashboardPipeline> {
  const [apps, enrollments] = await Promise.all([
    db.from('applications').select('stage'),
    db.from('program_enrollments').select('status'),
  ]);

  const count = <T extends string>(rows: { [k: string]: T }[] | null, key: string, val: T) =>
    (rows ?? []).filter(r => r[key] === val).length;

  const a = apps.data as { stage: string }[] | null;
  const e = enrollments.data as { status: string }[] | null;

  return {
    applications: {
      draft:     count(a, 'stage', 'draft'),
      submitted: count(a, 'stage', 'submitted'),
      approved:  count(a, 'stage', 'approved'),
      rejected:  count(a, 'stage', 'rejected'),
    },
    enrollments: {
      enrolled:  count(e, 'status', 'enrolled'),
      active:    count(e, 'status', 'active'),
      completed: count(e, 'status', 'completed'),
      withdrawn: count(e, 'status', 'withdrawn'),
    },
  };
}
