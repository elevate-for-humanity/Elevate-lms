/**
 * GET  /api/workforce-board/cases
 * POST /api/workforce-board/cases
 *
 * WIOA case management.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { emitEvent } from '@/lib/platform/events';

const ALLOWED_ROLES = ['workforce_board', 'admin', 'staff'];

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;
  if (!ALLOWED_ROLES.includes(auth.role ?? '')) return safeError('Forbidden', 403);

  const { searchParams } = req.nextUrl;
  const page   = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit  = Math.min(100, Number(searchParams.get('limit') ?? 25));
  const status = searchParams.get('status');
  const from   = (page - 1) * limit;

  try {
    const supabase = await getAdminClient();
    let q = supabase
      .from('wioa_cases')
      .select(`
        id, case_number, status, opened_at, closed_at,
        participant_id, case_manager_id, program_id,
        funding_amount, funding_used, notes,
        wioa_participants(first_name, last_name, email),
        programs(title, slug)
      `, { count: 'exact' })
      .order('opened_at', { ascending: false })
      .range(from, from + limit - 1);

    if (status) q = q.eq('status', status) as typeof q;

    const { data, count, error } = await q;
    if (error) return safeDbError(error, 'Failed to fetch cases');

    return NextResponse.json({ cases: data ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch cases');
  }
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;
  if (!ALLOWED_ROLES.includes(auth.role ?? '')) return safeError('Forbidden', 403);

  try {
    const body = await req.json();
    const { participant_id, program_id, funding_amount, notes } = body;

    if (!participant_id) return safeError('participant_id is required', 400);

    const supabase = await getAdminClient();
    const caseNumber = `WIOA-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase
      .from('wioa_cases')
      .insert({
        case_number: caseNumber,
        participant_id,
        program_id,
        funding_amount: funding_amount ?? 0,
        case_manager_id: auth.id,
        status: 'open',
        opened_at: new Date().toISOString(),
        notes,
      })
      .select('id, case_number, status, opened_at')
      .single();

    if (error) return safeDbError(error, 'Failed to create case');

    await emitEvent('case.opened', 'compliance', {
      actor_id: auth.id,
      actor_type: 'user',
      subject_id: data.id,
      subject_type: 'wioa_case',
      message: `WIOA case opened: ${caseNumber}`,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return safeInternalError(err, 'Failed to create case');
  }
}
