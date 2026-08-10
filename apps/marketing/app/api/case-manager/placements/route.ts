import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PlacementStatus = 'verified' | 'rejected' | 'lost';
type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'apprenticeship' | 'self_employed';
type VerificationMethod = 'employer_contact' | 'pay_stub' | 'offer_letter' | 'self_report';

const ALLOWED_ROLES = new Set(['case_manager', 'admin', 'super_admin', 'staff']);
const EMPLOYMENT_TYPES = new Set<EmploymentType>(['full_time', 'part_time', 'contract', 'apprenticeship', 'self_employed']);
const VERIFICATION_METHODS = new Set<VerificationMethod>(['employer_contact', 'pay_stub', 'offer_letter', 'self_report']);
const STATUSES = new Set<PlacementStatus>(['verified', 'rejected', 'lost']);

async function requireCaseManager() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { supabase, user: null, error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.role || !ALLOWED_ROLES.has(profile.role)) {
    return { supabase, user: null, error: NextResponse.json({ error: 'Case manager access required' }, { status: 403 }) };
  }

  return { supabase, user, error: null };
}

export async function POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireCaseManager();
  if (auth.error || !auth.user) return auth.error!;

  const body = await request.json().catch(() => ({}));
  const learnerId = typeof body.learnerId === 'string' ? body.learnerId.trim() : '';
  const employerName = typeof body.employerName === 'string' ? body.employerName.trim() : '';
  const jobTitle = typeof body.jobTitle === 'string' ? body.jobTitle.trim() : '';
  const employmentType = body.employmentType as EmploymentType;
  const verificationMethod = body.verificationMethod as VerificationMethod | undefined;
  const startDate = typeof body.startDate === 'string' && body.startDate ? body.startDate : null;
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 4000) : null;
  const wageValue = body.hourlyWage === '' || body.hourlyWage == null ? null : Number(body.hourlyWage);

  if (!learnerId || !employerName || !jobTitle || !EMPLOYMENT_TYPES.has(employmentType)) {
    return NextResponse.json({ error: 'Learner, employer, job title, and valid employment type are required.' }, { status: 400 });
  }
  if (wageValue !== null && (!Number.isFinite(wageValue) || wageValue < 0 || wageValue > 999999.99)) {
    return NextResponse.json({ error: 'Hourly wage is invalid.' }, { status: 400 });
  }
  if (verificationMethod && !VERIFICATION_METHODS.has(verificationMethod)) {
    return NextResponse.json({ error: 'Verification method is invalid.' }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from('placement_records')
    .insert({
      learner_id: learnerId,
      case_manager_id: auth.user.id,
      employer_name: employerName,
      job_title: jobTitle,
      employment_type: employmentType,
      hourly_wage: wageValue,
      start_date: startDate,
      status: 'pending',
      verification_method: verificationMethod || null,
      notes,
    })
    .select('id, status')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Unable to save placement.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, placement: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireCaseManager();
  if (auth.error || !auth.user) return auth.error!;

  const body = await request.json().catch(() => ({}));
  const placementId = typeof body.placementId === 'string' ? body.placementId.trim() : '';
  const status = body.status as PlacementStatus;
  const verificationMethod = body.verificationMethod as VerificationMethod | undefined;
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 4000) : undefined;

  if (!placementId || !STATUSES.has(status)) {
    return NextResponse.json({ error: 'Placement ID and valid status are required.' }, { status: 400 });
  }
  if (verificationMethod && !VERIFICATION_METHODS.has(verificationMethod)) {
    return NextResponse.json({ error: 'Verification method is invalid.' }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
    ...(notes !== undefined ? { notes } : {}),
    ...(verificationMethod ? { verification_method: verificationMethod } : {}),
  };
  if (status === 'verified') {
    update.verified_at = new Date().toISOString();
    update.verified_by = auth.user.id;
  }

  const { data, error } = await auth.supabase
    .from('placement_records')
    .update(update)
    .eq('id', placementId)
    .select('id, status, verified_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Unable to update placement.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, placement: data });
}
