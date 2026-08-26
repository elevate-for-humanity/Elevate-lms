import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveApprenticeshipRuntimeContext } from '@/lib/apprenticeship/runtime-context';
import { loadRegisteredApprenticeshipProgress } from '@/lib/apprenticeship/progress-service';
import { getIndianaPracticalEvidenceRequirement, validatePracticalEvidence } from '@/lib/apprenticeship/state-practical-evidence';

export const dynamic = 'force-dynamic';

const HOST_SHOP_ADMIN_COOKIE = '__efh_host_shop_partner';
const PLATFORM_ADMIN_ROLES = new Set(['admin', 'super_admin', 'org_admin']);
const HOST_SHOP_PROFILE_ROLES = new Set(['partner', 'host_shop', 'host_shop_admin', 'program_holder']);
const HOST_SHOP_MEMBERSHIP_ROLES = new Set(['owner', 'partner_admin', 'admin', 'supervisor', 'mentor', 'manager']);

function initials(name: string | null | undefined) {
  return (name || '').split(/\s+/).filter(Boolean).slice(0, 3).map((part) => part[0]?.toUpperCase()).join('');
}

async function getAuthContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const db = await requireAdminClient();
  const [{ data: profile }, { data: memberships }] = await Promise.all([
    db.from('profiles').select('id, role, full_name, email').eq('id', user.id).maybeSingle(),
    db.from('partner_users').select('partner_id, role, status').eq('user_id', user.id).eq('status', 'active'),
  ]);
  const profileRole = String(profile?.role || '').trim().toLowerCase();
  const membership = (memberships || []).find((row: any) => HOST_SHOP_MEMBERSHIP_ROLES.has(String(row.role || '').trim().toLowerCase()));
  const membershipRole = String(membership?.role || '').trim().toLowerCase();
  const isPlatformAdmin = PLATFORM_ADMIN_ROLES.has(profileRole);
  const isHostShopProfile = HOST_SHOP_PROFILE_ROLES.has(profileRole);
  const isHostShopMember = Boolean(membership?.partner_id && HOST_SHOP_MEMBERSHIP_ROLES.has(membershipRole));
  if (!isPlatformAdmin && !isHostShopProfile && !isHostShopMember) return null;
  return { user, db, profile, membershipRole, membershipPartnerId: membership?.partner_id || null, isPlatformAdmin };
}

async function getAuthorizedShopIds(db: any, userId: string, isPlatformAdmin: boolean, membershipPartnerId: string | null) {
  const { data: staffRows } = await db.from('shop_staff')
    .select('shop_id, active, shops:shops!inner(id, active, partner_id)')
    .eq('user_id', userId).eq('active', true).eq('shops.active', true);
  const staffShopIds = (staffRows || []).map((row: any) => row.shop_id).filter(Boolean);
  if (staffShopIds.length) return Array.from(new Set(staffShopIds));

  let partnerId: string | null = membershipPartnerId;
  if (isPlatformAdmin) {
    const cookieStore = await cookies();
    partnerId = cookieStore.get(HOST_SHOP_ADMIN_COOKIE)?.value || partnerId;
  }
  if (!partnerId) return [];

  const { data: partner } = await db.from('partners')
    .select('id, status, approval_status, verification_status, is_active, mou_signed, onboarding_completed')
    .eq('id', partnerId).maybeSingle();
  if (!partner || partner.status !== 'active' || partner.approval_status !== 'approved' || partner.verification_status !== 'verified' || partner.is_active === false || !partner.mou_signed || !partner.onboarding_completed) return [];
  const { data: shops } = await db.from('shops').select('id').eq('partner_id', partnerId).eq('active', true);
  return (shops || []).map((shop: any) => shop.id).filter(Boolean);
}

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { user, db, membershipRole, membershipPartnerId, isPlatformAdmin } = ctx;
  const shopIds = await getAuthorizedShopIds(db, user.id, isPlatformAdmin, membershipPartnerId);
  if (shopIds.length === 0) return NextResponse.json({ error: 'No active verified Host Shop assignment found' }, { status: 403 });

  let placementsQuery = db.from('apprentice_placements')
    .select('id, student_id, program_slug, shop_id, start_date, status, supervisor_user_id')
    .in('shop_id', shopIds).eq('status', 'active');
  if (!isPlatformAdmin && ['supervisor', 'mentor'].includes(membershipRole)) placementsQuery = placementsQuery.eq('supervisor_user_id', user.id);
  const { data: placements, error: placementError } = await placementsQuery;
  if (placementError) return NextResponse.json({ error: placementError.message }, { status: 500 });
  if (!(placements || []).length) return NextResponse.json({ apprentices: [] });

  const studentIds = Array.from(new Set((placements || []).map((row: any) => row.student_id).filter(Boolean)));
  const [{ data: profiles }, { data: enrollments, error: enrollmentError }] = await Promise.all([
    db.from('profiles').select('id, full_name, email').in('id', studentIds),
    db.from('program_enrollments').select('id, user_id, student_id, program_slug, status, created_at')
      .or(`user_id.in.(${studentIds.join(',')}),student_id.in.(${studentIds.join(',')})`)
      .in('status', ['active', 'enrolled', 'in_progress', 'confirmed']).order('created_at', { ascending: false }),
  ]);
  if (enrollmentError) return NextResponse.json({ error: enrollmentError.message }, { status: 500 });

  const profileById = new Map((profiles || []).map((row: any) => [row.id, row]));
  const enrollmentByPlacement = new Map<string, any>();
  for (const placement of placements || []) {
    const enrollment = (enrollments || []).find((row: any) => {
      const studentId = row.user_id || row.student_id;
      return studentId === placement.student_id && row.program_slug === placement.program_slug;
    });
    if (enrollment) enrollmentByPlacement.set(placement.id, enrollment);
  }

  const apprentices = [];
  for (const placement of placements || []) {
    const enrollment = enrollmentByPlacement.get(placement.id);
    if (!enrollment) continue;
    try {
      const runtime = await resolveApprenticeshipRuntimeContext(db, { enrollmentId: enrollment.id });
      if (!runtime?.contract || runtime.placement?.id !== placement.id) continue;
      const progress = await loadRegisteredApprenticeshipProgress(db, runtime);
      const apprenticeProfile: any = profileById.get(placement.student_id) || {};
      apprentices.push({
        placementId: placement.id,
        shopId: placement.shop_id,
        studentId: placement.student_id,
        enrollmentId: enrollment.id,
        programSlug: runtime.programSlug,
        standardVersionKey: runtime.contract.standardVersionKey,
        name: apprenticeProfile.full_name || apprenticeProfile.email || 'Apprentice',
        email: apprenticeProfile.email || '',
        standard: runtime.contract.standard,
        completion: runtime.contract.completion,
        sponsor: runtime.contract.sponsor,
        completedCompetencies: progress.competencies.completed,
        competencyRecords: progress.competencies.records,
      });
    } catch (error) {
      // Fail closed for placements whose registered standard is not configured.
      continue;
    }
  }

  return NextResponse.json({ apprentices });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { user, db, profile, membershipPartnerId, isPlatformAdmin } = ctx;
  const body = await req.json().catch(() => null);
  const enrollmentId = typeof body?.enrollmentId === 'string' ? body.enrollmentId.trim() : '';
  const competencyId = typeof body?.competencyId === 'string' ? body.competencyId.trim() : '';
  const completed = Boolean(body?.completed);
  const notes = typeof body?.notes === 'string' ? body.notes.trim().slice(0, 4000) : null;
  const performanceSubject = typeof body?.performanceSubject === 'string' ? body.performanceSubject.trim() : null;
  const evidenceType = typeof body?.evidenceType === 'string' ? body.evidenceType.trim() : null;
  const evidenceUrl = typeof body?.evidenceUrl === 'string' ? body.evidenceUrl.trim().slice(0, 2000) : null;
  const performedAt = typeof body?.performedAt === 'string' ? body.performedAt.trim() : null;
  const instructorLicenseNumber = typeof body?.instructorLicenseNumber === 'string'
    ? body.instructorLicenseNumber.trim().slice(0, 100)
    : null;
  if (!enrollmentId || !competencyId) return NextResponse.json({ error: 'enrollmentId and competencyId are required' }, { status: 400 });

  let runtime;
  try {
    runtime = await resolveApprenticeshipRuntimeContext(db, { enrollmentId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Registered program contract unavailable' }, { status: 409 });
  }
  if (!runtime?.contract) return NextResponse.json({ error: 'Enrollment is not bound to an active registered-program standard' }, { status: 409 });
  const competency = runtime.contract.standard.competencies.find((item) => item.id === competencyId);
  if (!competency) {
    return NextResponse.json({ error: 'Competency is not part of the active approved registered-program standard' }, { status: 400 });
  }
  const practical = getIndianaPracticalEvidenceRequirement(competency);
  const evidenceValidation = validatePracticalEvidence({
    required: completed && practical.required,
    performanceSubject,
    evidenceUrl,
    performedAt,
    instructorLicenseNumber,
  });
  if (!evidenceValidation.valid) {
    return NextResponse.json({
      error: 'Indiana practical evidence is incomplete',
      missing: evidenceValidation.missing,
      requirement: practical,
    }, { status: 422 });
  }

  const shopIds = await getAuthorizedShopIds(db, user.id, isPlatformAdmin, membershipPartnerId);
  if (!runtime.placement || !shopIds.includes(runtime.placement.shop_id)) {
    return NextResponse.json({ error: 'You are not assigned to this apprentice placement' }, { status: 403 });
  }
  if (runtime.placement.program_slug !== runtime.programSlug) {
    return NextResponse.json({ error: 'Placement program does not match enrollment program' }, { status: 409 });
  }
  if (!isPlatformAdmin && runtime.placement.supervisor_user_id !== user.id) {
    return NextResponse.json({ error: 'Only the assigned supervisor may verify this apprentice competency' }, { status: 403 });
  }

  const verifiedName = profile?.full_name || profile?.email || user.email || 'Verified supervisor';
  const today = new Date().toISOString().slice(0, 10);
  const { data: record, error } = await db.from('apprentice_competency_records').upsert({
    enrollment_id: enrollmentId,
    competency_id: competencyId,
    completed,
    date_completed: completed ? today : null,
    verified_by: user.id,
    verified_by_name: verifiedName,
    notes,
    requires_practical_evidence: practical.required,
    performance_subject: completed && practical.required ? performanceSubject : null,
    evidence_type: completed && practical.required ? (evidenceType || 'observation') : null,
    evidence_url: completed && practical.required ? evidenceUrl : null,
    practical_performed_at: completed && practical.required ? performedAt : null,
    evidence_review_status: completed && practical.required ? 'approved' : 'not_required',
    verified_by_license_number: completed && practical.required ? instructorLicenseNumber : null,
    state_authority: practical.authority,
    state_standard_version: practical.standardVersion,
    state_requirement_citation: practical.citation,
    evidence_verified_at: completed && practical.required ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'enrollment_id,competency_id' })
    .select('id, enrollment_id, competency_id, completed, date_completed, verified_by, verified_by_name, notes, requires_practical_evidence, performance_subject, evidence_type, evidence_url, practical_performed_at, evidence_review_status, verified_by_license_number, state_standard_version, updated_at').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record, verifierInitials: initials(verifiedName), standardVersionKey: runtime.contract.standardVersionKey });
}
