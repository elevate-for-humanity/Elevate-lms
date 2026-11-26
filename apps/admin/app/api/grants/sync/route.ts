/**
 * POST /api/grants/sync
 *
 * "Sync Opportunities" button on /grants. Opportunity syncing pulls from
 * the sources registered in grant_sources. No sources are currently
 * registered, so the sync is an honest no-op that reports the current
 * opportunity count instead of failing with a 404.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return safeError('Forbidden', 403);
  }

  const [sources, opportunities] = await Promise.all([
    db.from('grant_sources').select('id', { count: 'exact', head: true }),
    db.from('grant_opportunities').select('id', { count: 'exact', head: true }),
  ]);

  return NextResponse.json({
    synced: 0,
    sources: sources.count ?? 0,
    opportunities: opportunities.count ?? 0,
    message:
      (sources.count ?? 0) === 0
        ? 'No grant sources are registered in grant_sources, so there is nothing to sync from yet.'
        : 'Grant sources are registered but no sync adapter is configured for them yet.',
  });
}
