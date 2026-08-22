import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { normalizeRoles, type UserRole } from '@/lib/rbac/role-matrix';
import { getCaseManagerParticipants, hasCaseManagerOversight } from '@/lib/case-manager/participant-scope';
import { logAction } from '@/lib/audit/logAction';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PlacementStatus = 'verified' | 'rejected' | 'lost';
type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'apprenticeship' | 'self_employed';
type VerificationMethod = 'employer_contact' | 'pay_stub' | 'offer_letter' | 'self_report';

const EMPLOYMENT_TYPES = new Set<EmploymentType>(['full_time', 'part_time', 'contract', 'apprenticeship', 'self_employed']);
const VERIFICATION_METHODS = new Set<VerificationMethod>(['employer_contact', 'pay_stub', 'offer_letter', 'self_report']);
const STATUSES = new Set<PlacementStatus>(['verified', 'rejected', 'lost']);

type PlacementAuth = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email?: string } | null;
  effectiveRoles: UserRole[];
  error: NextResponse | null;
};

async function requireCaseManager(): Promise<PlacementAuth> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { supabase, user: null, effectiveRoles: [], error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  }

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    supabase.from('user_roles').select('roles(name)').eq('user_id', user.id),
  ]);
  const effectiveRoles = normalizeRoles([
    profile?.role,
    ...(roleRows ?? []).map((row: any) => row.roles?.name),
  ]);
  if (!effectiveRoles.some((role) => ['case_manager', 'admin', 'super_admin', 'staff'].includes(role))) {
    return { supabase, user: null, effectiveRoles, error: NextResponse.json({ error: 'Case manager access required' }, { status: 403 }) };
  }

  return { supabase, user: { id: user.id, email: user.email }, effectiveRoles, error: null };
}

async function allowedLearnerIds(auth: PlacementAuth): Promise<Set<string> | null> {
  if (!auth.user) return new Set();
  if (hasCaseManagerOversight(auth.effectiveRoles)) return null;
  const participants = await getCaseManagerParticipants({
    db: auth.supabase,
    userId: auth.user.id,
    effectiveRoles: auth.effectiveRoles,
  });
  return new Set(participants.map((participant) => participant.learnerId).filter((id): id is string => Boolean(id)));
}

function actorRole(roles: readonly string[]) {
  return roles.find((role) => ['admin', 'super_admin', 'staff', 'case_manager'].includes(role)) || 'case_manager';
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

  const allowed = await allowedLearnerIds(auth);
  if (allowed && !allowed.has(learnerId)) {
    return NextResponse.json({ error: 'This participant is outside your assigned caseload.' }, { status: 403 });
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

  if (error) return NextResponse.json({ error: 'Unable to save placement.' }, { status: 400 });

  await logAction(auth.user.id, actorRole(auth.effectiveRoles), {
    action: 'placement_created',
    entity_type: 'placement_record',
    entity_id: data.id,
    metadata: { learner_id: learnerId, employer_name: employerName, status: 'pending' },
  });

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

  const { data: existing, error: existingError } = await auth.supabase
    .from('placement_records')
    .select('id, learner_id, case_manager_id, status')
    .eq('id', placementId)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: 'Unable to authorize placement.' }, { status: 400 });
  if (!existing) return NextResponse.json({ error: 'Placement not found.' }, { status: 404 });

  const allowed = await allowedLearnerIds(auth);
  if (allowed && !allowed.has(String(existing.learner_id || ''))) {
    return NextResponse.json({ error: 'This placement is outside your assigned caseload.' }, { status: 403 });
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
  if (error) return NextResponse.json({ error: 'Unable to update placement.' }, { status: 400 });

  await logAction(auth.user.id, actorRole(auth.effectiveRoles), {
    action: 'placement_status_updated',
    entity_type: 'placement_record',
    entity_id: placementId,
    metadata: { from_status: existing.status, to_status: status, learner_id: existing.learner_id },
  });

  return NextResponse.json({ ok: true, placement: data });
}
