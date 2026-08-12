import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeDbError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Admin-owned source of truth for apprenticeship hours awaiting verification.
 *
 * progress_entries intentionally has no PostgREST FK relationship to profiles or
 * apprenticeship_programs in production, so joins must be hydrated explicitly.
 */
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    const { data: entries, error: entriesError } = await db
      .from('progress_entries')
      .select('id,apprentice_id,program_id,status,week_ending,hours_worked,tasks_completed,created_at,verified_by,verified_at')
      .eq('status', 'submitted')
      .is('verified_by', null)
      .order('week_ending', { ascending: true })
      .limit(100);

    if (entriesError) return safeDbError(entriesError, 'Failed to load pending apprenticeship hours');
    if (!entries?.length) return NextResponse.json({ entries: [] });

    const apprenticeIds = [...new Set(entries.map((entry) => entry.apprentice_id).filter(Boolean))] as string[];
    const programRefs = [...new Set(entries.map((entry) => String(entry.program_id ?? '').trim()).filter(Boolean))];
    const programIds = programRefs.filter((value) => UUID_RE.test(value));
    const programSlugs = programRefs.filter((value) => !UUID_RE.test(value));

    const profilesPromise = apprenticeIds.length
      ? db.from('profiles').select('id,full_name,email').in('id', apprenticeIds)
      : Promise.resolve({ data: [], error: null } as any);
    const programsByIdPromise = programIds.length
      ? db.from('apprenticeship_programs').select('id,name,slug').in('id', programIds)
      : Promise.resolve({ data: [], error: null } as any);
    const programsBySlugPromise = programSlugs.length
      ? db.from('apprenticeship_programs').select('id,name,slug').in('slug', programSlugs)
      : Promise.resolve({ data: [], error: null } as any);

    const [profilesResult, programsByIdResult, programsBySlugResult] = await Promise.all([
      profilesPromise,
      programsByIdPromise,
      programsBySlugPromise,
    ]);

    if (profilesResult.error) return safeDbError(profilesResult.error, 'Failed to hydrate apprentice profiles');
    if (programsByIdResult.error) return safeDbError(programsByIdResult.error, 'Failed to hydrate apprenticeship programs');
    if (programsBySlugResult.error) return safeDbError(programsBySlugResult.error, 'Failed to hydrate apprenticeship programs');

    const profileMap = new Map((profilesResult.data ?? []).map((profile: any) => [String(profile.id), profile]));
    const programMap = new Map<string, any>();
    for (const program of [...(programsByIdResult.data ?? []), ...(programsBySlugResult.data ?? [])]) {
      programMap.set(String(program.id), program);
      if (program.slug) programMap.set(String(program.slug), program);
    }

    const hydrated = entries.map((entry) => ({
      ...entry,
      profiles: entry.apprentice_id ? profileMap.get(String(entry.apprentice_id)) ?? null : null,
      apprenticeship_programs: entry.program_id ? programMap.get(String(entry.program_id)) ?? null : null,
    }));

    return NextResponse.json({ entries: hydrated });
  } catch (error) {
    return safeInternalError(error, 'Failed to load pending apprenticeship hours');
  }
}
