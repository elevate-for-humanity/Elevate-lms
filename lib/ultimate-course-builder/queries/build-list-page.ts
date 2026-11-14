import type { SupabaseClient } from '@supabase/supabase-js';

export function parseBuildListPage(value: string | null): number | null {
  if (value === null) return 1;
  if (!/^[1-9]\d{0,4}$/.test(value)) return null;
  const page = Number(value);
  return page <= 10_000 ? page : null;
}

/** Bounded pages with a lookahead row; older builds remain explicitly reachable. */
export async function loadUltimateBuildPage(db: SupabaseClient, courseId: string | undefined, page: number) {
  if (!Number.isInteger(page) || page < 1 || page > 10_000) throw new Error('ULTIMATE_BUILD_PAGE_INVALID');
  const pageSize = 50;
  const offset = (page - 1) * pageSize;
  let query = db.from('ultimate_course_builds').select(
    'id,course_id,status,owner_paused:profile->ownerPaused,current_step,created_at,updated_at,ultimate_build_jobs(id,status,available_at,last_error,created_at,updated_at,heartbeat_at,lease_owner,lease_expires_at,attempts,max_attempts,execution_generation,payload,monitor)',
  ).order('created_at', { ascending: false }).order('id', { ascending: false })
    .range(offset, offset + pageSize);
  if (courseId) query = query.eq('course_id', courseId);
  const { data, error } = await query;
  const rows = data ?? [];
  const hasMore = !error && rows.length > pageSize;
  return {
    data: rows.slice(0, pageSize), error,
    pagination: { page, pageSize, hasMore, nextPage: hasMore ? page + 1 : null },
  };
}
