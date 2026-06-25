/**
 * GET  /api/workforce-board/participants
 * POST /api/workforce-board/participants
 *
 * List and create WIOA participants.
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
  const search = searchParams.get('search');
  const from   = (page - 1) * limit;

  try {
    const supabase = await getAdminClient();
    let q = supabase
      .from('wioa_participants')
      .select(`
        id, first_name, last_name, email, phone,
        status, program_id, enrollment_date, exit_date,
        case_manager_id, created_at,
        programs(title, slug)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (status) q = q.eq('status', status) as typeof q;
    if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`) as typeof q;

    const { data, count, error } = await q;
    if (error) return safeDbError(error, 'Failed to fetch participants');

    return NextResponse.json({ participants: data ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch participants');
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
    const { first_name, last_name, email, phone, program_id, status = 'active' } = body;

    if (!first_name || !last_name || !email) {
      return safeError('first_name, last_name, and email are required', 400);
    }

    const supabase = await getAdminClient();
    const { data, error } = await supabase
      .from('wioa_participants')
      .insert({ first_name, last_name, email, phone, program_id, status, enrollment_date: new Date().toISOString() })
      .select('id, first_name, last_name, email, status')
      .single();

    if (error) return safeDbError(error, 'Failed to create participant');

    await emitEvent('participant.created', 'enrollment', {
      actor_id: auth.id,
      actor_type: 'user',
      subject_id: data.id,
      subject_type: 'participant',
      message: `WIOA participant created: ${first_name} ${last_name}`,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return safeInternalError(err, 'Failed to create participant');
  }
}
