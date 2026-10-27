import 'server-only';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  hydrateAdminHours,
  applyLedgerReview,
  type HoursLedgerEntry,
  summarizeAdminHours,
  type ProgressHoursEntry,
  type HoursApprentice,
  type HoursProgram,
  type HoursProfile,
} from './admin-hours-model';

const PAGE_SIZE = 500;
// Fetch every page; a growing queue must never silently hide later records.
export async function readHoursPages<T>(
  query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const result = await query(offset, offset + PAGE_SIZE - 1);
    if (result.error) throw result.error;
    const page = result.data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

export async function loadAdminHours(db: Awaited<ReturnType<typeof requireAdminClient>>) {
  const [rows, apprentices, programs, ledger] = await Promise.all([
    readHoursPages<ProgressHoursEntry>((from, to) =>
      db
        .from('progress_entries')
        .select(
          'id,apprentice_id,partner_id,program_id,status,work_date,week_ending,hours_worked,max_hours_per_week,notes,tasks_completed,clock_in_at,clock_out_at,verified_by,verified_at',
        )
        .order('work_date', { ascending: false })
        .order('id')
        .range(from, to),
    ),
    readHoursPages<HoursApprentice>((from, to) =>
      db
        .from('apprentices')
        .select('id,user_id,program_id,total_hours_required,status,start_date,enrollment_date')
        .order('id')
        .range(from, to),
    ),
    readHoursPages<HoursProgram>((from, to) =>
      db
        .from('programs')
        .select('id,slug,name,title,required_hours,total_hours')
        .order('id')
        .range(from, to),
    ),
    readHoursPages<HoursLedgerEntry>((from, to) =>
      db
        .from('hour_entries')
        .select(
          'id,user_id,program_slug,progress_entry_id,legacy_source,legacy_id,status,work_date,hours_claimed,accepted_hours,source_type',
        )
        .order('id')
        .range(from, to),
    ),
  ]);
  const ids = [
    ...new Set(
      [...rows.map((r) => r.apprentice_id), ...apprentices.map((a) => a.user_id)].filter(Boolean),
    ),
  ];
  const profiles: HoursProfile[] = [];
  for (let offset = 0; offset < ids.length; offset += PAGE_SIZE) {
    const result = await db
      .from('profiles')
      .select('id,full_name,email')
      .in('id', ids.slice(offset, offset + PAGE_SIZE));
    if (result.error) throw result.error;
    profiles.push(...(result.data ?? []));
  }
  const entries = hydrateAdminHours(rows, apprentices, programs, profiles);
  applyLedgerReview(entries, ledger, programs);
  return {
    entries,
    apprentices,
    programs,
    profiles,
    ledger,
    summaries: summarizeAdminHours(entries),
  };
}
