/**
 * GET  /api/workforce-board/funding
 * POST /api/workforce-board/funding
 *
 * Funding authorization management (ITA vouchers, WIOA funding).
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
  const status = searchParams.get('status');
  const limit  = Math.min(100, Number(searchParams.get('limit') ?? 50));

  try {
    const supabase = await getAdminClient();
    let q = supabase
      .from('ita_vouchers')
      .select(`
        id, voucher_number, amount, status, issued_at, expires_at,
        user_id, program_id, case_id,
        profiles(full_name, email),
        programs(title, slug)
      `, { count: 'exact' })
      .order('issued_at', { ascending: false })
      .limit(limit);

    if (status) q = q.eq('status', status) as typeof q;

    const { data, count, error } = await q;
    if (error) return safeDbError(error, 'Failed to fetch funding');

    // Aggregate totals
    const totalAuthorized = (data ?? []).reduce((sum: number, v: { amount?: number }) => sum + (v.amount ?? 0), 0);

    return NextResponse.json({ vouchers: data ?? [], total: count ?? 0, total_authorized: totalAuthorized });
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch funding');
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
    const { user_id, program_id, amount, case_id, expires_days = 90 } = body;

    if (!user_id || !program_id || !amount) {
      return safeError('user_id, program_id, and amount are required', 400);
    }

    const supabase = await getAdminClient();
    const voucherNumber = `ITA-${Date.now().toString(36).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + expires_days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('ita_vouchers')
      .insert({
        voucher_number: voucherNumber,
        user_id,
        program_id,
        case_id,
        amount,
        status: 'issued',
        issued_at: new Date().toISOString(),
        expires_at: expiresAt,
        issued_by: auth.id,
      })
      .select('id, voucher_number, amount, status, issued_at, expires_at')
      .single();

    if (error) return safeDbError(error, 'Failed to create voucher');

    await emitEvent('funding.authorized', 'compliance', {
      actor_id: auth.id,
      actor_type: 'user',
      subject_id: data.id,
      subject_type: 'ita_voucher',
      payload: { amount, voucher_number: voucherNumber },
      message: `ITA voucher issued: ${voucherNumber} ($${amount})`,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return safeInternalError(err, 'Failed to create voucher');
  }
}
