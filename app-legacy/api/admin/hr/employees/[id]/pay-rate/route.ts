/**
 * Set or update pay rate for an employee.
 * PATCH { rate, payment_type, payout_method, payroll_provider, effective_date }
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Props) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id: employeeId } = await params;

  let body: {
    rate?: number;
    payment_type?: string;
    payout_method?: string;
    payroll_provider?: string;
    effective_date?: string;
    notes?: string;
  };
  try { body = await request.json(); }
  catch { return safeError('Invalid request body', 400); }

  if (body.rate !== undefined && (isNaN(body.rate) || body.rate < 0)) {
    return safeError('Invalid rate', 400);
  }

  const supabase = await getAdminClient();
  if (!supabase) return safeInternalError(new Error('DB unavailable'), 'Failed');

  // Get employee's user_id
  const { data: employee } = await supabase
    .from('employees')
    .select('id, user_id, salary, hourly_rate, employment_type')
    .eq('id', employeeId)
    .maybeSingle();

  if (!employee) return safeError('Employee not found', 404);

  const now = new Date().toISOString();

  // Update employees table (salary / hourly_rate depending on type)
  const paymentType = body.payment_type ?? employee.employment_type ?? 'hourly';
  const employeeUpdate: Record<string, unknown> = { updated_at: now };
  if (body.rate !== undefined) {
    if (paymentType === 'salary') {
      employeeUpdate.salary = body.rate;
    } else {
      employeeUpdate.hourly_rate = body.rate;
    }
  }
  if (body.payment_type) employeeUpdate.employment_type = body.payment_type;

  const { error: empErr } = await supabase
    .from('employees')
    .update(employeeUpdate)
    .eq('id', employeeId);

  if (empErr) {
    logger.warn('[pay-rate] employees update failed', empErr);
  }

  // Upsert payroll_profile for this user
  if (employee.user_id) {
    const { data: existing } = await supabase
      .from('payroll_profiles')
      .select('id')
      .eq('user_id', employee.user_id)
      .maybeSingle();

    const profileData = {
      rate: body.rate,
      payment_type: body.payment_type ?? null,
      payout_method: body.payout_method ?? null,
      payroll_provider: body.payroll_provider ?? null,
      updated_at: now,
    };

    if (existing) {
      await supabase.from('payroll_profiles').update(profileData).eq('id', existing.id);
    } else {
      await supabase.from('payroll_profiles').insert({
        user_id: employee.user_id,
        ...profileData,
        status: 'active',
        created_at: now,
      });
    }
  }

  // Insert pay_rate_history row for audit trail
  await supabase
    .from('pay_rate_history')
    .insert({
      employee_id: employeeId,
      rate: body.rate ?? null,
      payment_type: body.payment_type ?? null,
      payout_method: body.payout_method ?? null,
      effective_date: body.effective_date ?? now.split('T')[0],
      set_by: auth.id,
      notes: body.notes ?? null,
      created_at: now,
    })
    .then(undefined, (err) => logger.warn('[pay-rate] pay_rate_history insert failed (table may not exist yet)', err));

  logger.info('[pay-rate] updated', { employeeId, rate: body.rate, setBy: auth.id });

  return NextResponse.json({ success: true, message: 'Pay rate updated' });
}

export async function GET(request: NextRequest, { params }: Props) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id: employeeId } = await params;
  const supabase = await getAdminClient();
  if (!supabase) return safeInternalError(new Error('DB unavailable'), 'Failed');

  const { data: employee } = await supabase
    .from('employees')
    .select('id, user_id, salary, hourly_rate, employment_type')
    .eq('id', employeeId)
    .maybeSingle();

  if (!employee) return safeError('Employee not found', 404);

  const { data: payrollProfile } = await supabase
    .from('payroll_profiles')
    .select('rate, payment_type, payout_method, payroll_provider, tax_id_uploaded, w9_file_url, status')
    .eq('user_id', employee.user_id ?? '')
    .maybeSingle();

  const { data: history } = await supabase
    .from('pay_rate_history')
    .select('rate, payment_type, effective_date, notes, created_at')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(10)
    .then(()=>({ data: [] }), ()=>({ data: [] })) as { data: unknown[] };

  return NextResponse.json({
    employee_id: employeeId,
    current_rate: payrollProfile?.rate ?? employee.hourly_rate ?? employee.salary ?? null,
    payment_type: payrollProfile?.payment_type ?? employee.employment_type ?? null,
    payout_method: payrollProfile?.payout_method ?? null,
    payroll_provider: payrollProfile?.payroll_provider ?? null,
    w9_on_file: payrollProfile?.tax_id_uploaded ?? false,
    history: history ?? [],
  });
}
