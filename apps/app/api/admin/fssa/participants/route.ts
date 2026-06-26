import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError, safeInternalError } from '@/lib/api/safe-error';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const county = searchParams.get('county');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 500);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  let query = db
    .from('fssa_participants')
    .select(
      'id, first_name, last_name, email, phone, case_number, county, snap_eligible, abawd, enrollment_status, program_id, snap_et_enrolled_at, snap_et_exited_at, employed_at_exit, hourly_wage, created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('enrollment_status', status);
  if (county) query = query.eq('county', county);

  const { data, error, count } = await query;
  if (error) return safeDbError(error, 'Failed to fetch FSSA participants');

  return NextResponse.json({ participants: data ?? [], total: count ?? 0 });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.first_name || !body?.last_name) {
    return safeError('first_name and last_name are required', 400);
  }

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data, error } = await db
    .from('fssa_participants')
    .insert({
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      date_of_birth: body.date_of_birth ?? null,
      ssn_last4: body.ssn_last4 ?? null,
      case_number: body.case_number ?? null,
      county: body.county ?? null,
      snap_eligible: body.snap_eligible ?? true,
      abawd: body.abawd ?? false,
      orientation_completed: body.orientation_completed ?? false,
      program_id: body.program_id ?? null,
      cohort_id: body.cohort_id ?? null,
      enrollment_status: body.enrollment_status ?? 'pending',
      barriers: body.barriers ?? [],
      support_services: body.support_services ?? [],
      case_notes: body.case_notes ?? null,
      intake_completed_at: body.intake_completed_at ?? null,
      intake_staff_id: auth.id,
    })
    .select('id')
    .maybeSingle();

  if (error) return safeDbError(error, 'Failed to create FSSA participant');
  return NextResponse.json({ success: true, id: data?.id });
}

export async function PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.id) return safeError('id is required', 400);

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const allowed = [
    'enrollment_status', 'snap_et_enrolled_at', 'snap_et_exited_at', 'exit_reason',
    'employed_at_exit', 'employer_name', 'hourly_wage', 'hours_per_week', 'job_title',
    'employment_start_date', 'barriers', 'support_services', 'case_notes',
    'orientation_completed', 'program_id', 'cohort_id',
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return safeError('No valid fields to update', 400);
  }

  const { error } = await db
    .from('fssa_participants')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', body.id);

  if (error) return safeDbError(error, 'Failed to update FSSA participant');
  return NextResponse.json({ success: true });
}
