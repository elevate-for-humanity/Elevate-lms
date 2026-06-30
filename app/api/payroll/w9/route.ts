/**
 * W9 submission → payroll profile link.
 *
 * POST: Record a W9 upload, create/update the user's payroll_profile,
 *       and insert a w9_submissions audit row.
 * GET:  Return W9 status for the current user.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  const supabase = await getAdminClient();
  if (!supabase) return safeInternalError(new Error('DB unavailable'), 'Failed');

  const { data: profile } = await supabase
    .from('payroll_profiles')
    .select('id, tax_id_uploaded, w9_file_url, w9_uploaded_at, status, rate, payment_type, payout_method')
    .eq('user_id', auth.id)
    .maybeSingle();

  const { data: submissions } = await supabase
    .from('w9_submissions')
    .select('id, file_url, submitted_at, verified, verified_at')
    .eq('user_id', auth.id)
    .order('submitted_at', { ascending: false })
    .limit(5);

  return NextResponse.json({
    payroll_profile: profile ?? null,
    w9_submissions: submissions ?? [],
    w9_on_file: profile?.tax_id_uploaded ?? false,
  });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  let body: {
    w9_file_url: string;
    ein?: string;
    legal_name?: string;
    provider_app_id?: string;
    rate?: number;
    payment_type?: string;
    payout_method?: string;
    payroll_provider?: string;
  };
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid request body', 400);
  }

  if (!body.w9_file_url) return safeError('w9_file_url required', 400);

  const supabase = await getAdminClient();
  if (!supabase) return safeInternalError(new Error('DB unavailable'), 'Failed');

  const now = new Date().toISOString();

  // 1. Upsert payroll_profile — mark W9 as uploaded
  const { data: existingProfile } = await supabase
    .from('payroll_profiles')
    .select('id')
    .eq('user_id', auth.id)
    .maybeSingle();

  let payrollProfileId: string | null = existingProfile?.id ?? null;

  if (existingProfile) {
    await supabase
      .from('payroll_profiles')
      .update({
        tax_id_uploaded: true,
        w9_file_url: body.w9_file_url,
        w9_uploaded_at: now,
        ...(body.rate !== undefined && { rate: body.rate }),
        ...(body.payment_type && { payment_type: body.payment_type }),
        ...(body.payout_method && { payout_method: body.payout_method }),
        ...(body.payroll_provider && { payroll_provider: body.payroll_provider }),
        updated_at: now,
      })
      .eq('user_id', auth.id);
  } else {
    const { data: newProfile } = await supabase
      .from('payroll_profiles')
      .insert({
        user_id: auth.id,
        tax_id_uploaded: true,
        w9_file_url: body.w9_file_url,
        w9_uploaded_at: now,
        status: 'pending_review',
        rate: body.rate ?? null,
        payment_type: body.payment_type ?? null,
        payout_method: body.payout_method ?? null,
        payroll_provider: body.payroll_provider ?? null,
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single();
    payrollProfileId = newProfile?.id ?? null;
  }

  // 2. Insert w9_submissions audit row
  const { error: w9Err } = await supabase.from('w9_submissions').insert({
    user_id: auth.id,
    provider_app_id: body.provider_app_id ?? null,
    file_url: body.w9_file_url,
    ein: body.ein ?? null,
    legal_name: body.legal_name ?? null,
    submitted_at: now,
    payroll_profile_id: payrollProfileId,
  });

  if (w9Err) {
    logger.warn('[payroll/w9] w9_submissions insert failed', w9Err);
  }

  // 3. If this came from a provider application, update that row too
  if (body.provider_app_id) {
    await supabase
      .from('provider_applications')
      .update({ w9_file_url: body.w9_file_url })
      .eq('id', body.provider_app_id)
      .catch((err) => logger.warn('[payroll/w9] provider_applications update failed', err));
  }

  logger.info('[payroll/w9] W9 submitted and payroll profile updated', {
    userId: auth.id,
    payrollProfileId,
  });

  return NextResponse.json({
    success: true,
    message: 'W9 recorded and payroll profile updated',
    payroll_profile_id: payrollProfileId,
  });
}
