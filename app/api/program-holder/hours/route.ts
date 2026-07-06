/**
 * GET /api/program-holder/hours
 *
 * Returns hour_entries pending approval for the authenticated program_holder.
 * Admins see all pending entries. program_holder role is scoped to their
 * program via hour_entries.program_holder_id.
 *
 * Query params:
 *   status  — filter by status (default: 'pending'). Pass 'all' for all statuses.
 *   limit   — max rows (default: 50, max: 200)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') ?? 'pending';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, program_holder_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['program_holder', 'admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isAdmin = ['admin', 'super_admin'].includes(profile.role);

    // Resolve program_holder_id
    let programHolderId: string | null = profile.program_holder_id ?? null;
    if (!programHolderId && !isAdmin) {
      const { data: fallback } = await supabase
        .from('program_holders')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      programHolderId = fallback?.id ?? null;
    }

    if (!programHolderId && !isAdmin) {
      return NextResponse.json({ error: 'Program holder record not found' }, { status: 403 });
    }

    const db = await requireAdminClient();

    let query = db
      .from('hour_entries')
      .select(`
        id,
        user_id,
        work_date,
        hours_claimed,
        source_type,
        category,
        status,
        notes,
        rejection_reason,
        approved_by,
        approved_at,
        approved_by_role,
        program_holder_id,
        created_at
      `)
      .order('work_date', { ascending: false })
      .limit(limit);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (!isAdmin && programHolderId) {
      query = query.eq('program_holder_id', programHolderId);
    }

    const { data: entries, error: queryErr } = await query;
    if (queryErr) {
      logger.error('[program-holder/hours] query failed', queryErr);
      return NextResponse.json({ error: 'Failed to load hours' }, { status: 500 });
    }

    // Enrich with student profile data
    const userIds = [...new Set((entries ?? []).map((e: any) => e.user_id).filter(Boolean))];
    const profileMap: Record<string, { full_name: string; email: string }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await db
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      for (const p of profiles ?? []) {
        profileMap[p.id] = { full_name: p.full_name ?? 'Unknown', email: p.email ?? '' };
      }
    }

    const hours = (entries ?? []).map((e: any) => ({
      ...e,
      student: profileMap[e.user_id] ?? null,
    }));

    return NextResponse.json({ hours, total: hours.length });
  } catch (err) {
    logger.error('[program-holder/hours] Unexpected error', err as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiAudit('/api/program-holder/hours', _GET);
