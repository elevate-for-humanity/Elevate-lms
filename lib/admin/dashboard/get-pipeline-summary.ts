import type { SupabaseClient } from '@/lib/supabase';

export interface DashboardPipeline {
  applications: { draft: number; submitted: number; approved: number; rejected: number };
  enrollments: { enrolled: number; active: number; completed: number; withdrawn: number };
}

export async function getPipelineSummary(db: SupabaseClient): Promise<DashboardPipeline> {
  const [apps, enrollments] = await Promise.all([
    // applications has no stage column — use status
    db.from('applications').select('status'),
    db.from('program_enrollments').select('enrollment_state'),
  ]);

  const count = <T extends string>(rows: { [k: string]: T }[] | null, key: string, val: T) =>
    (rows ?? []).filter((r) => r[key] === val).length;

  const a = apps.data as { status: string }[] | null;
  const e = enrollments.data as { enrollment_state: string }[] | null;

  return {
    applications: {
      draft: count(a, 'status', 'draft'),
      submitted: count(a, 'status', 'submitted'),
      approved: count(a, 'status', 'approved'),
      rejected: count(a, 'status', 'rejected'),
    },
    enrollments: {
      enrolled: count(e, 'enrollment_state', 'enrolled'),
      active: count(e, 'enrollment_state', 'active'),
      completed: count(e, 'enrollment_state', 'completed'),
      withdrawn: count(e, 'enrollment_state', 'withdrawn'),
    },
  };
}
