import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveApprenticeshipRuntimeContext } from '@/lib/apprenticeship/runtime-context';
import { loadRegisteredApprenticeshipProgress } from '@/lib/apprenticeship/progress-service';

export const dynamic = 'force-dynamic';

const HOST_SHOP_ADMIN_COOKIE = '__efh_host_shop_partner';
const PLATFORM_ADMIN_ROLES = new Set(['admin', 'super_admin', 'org_admin']);
const HOST_SHOP_PROFILE_ROLES = new Set(['partner', 'host_shop', 'host_shop_admin', 'program_holder']);
const HOST_SHOP_MEMBERSHIP_ROLES = new Set(['owner', 'partner_admin', 'admin', 'supervisor', 'mentor', 'manager']);

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
  if (!isPlatformAdmin && staffShopIds.length) return Array.from(new Set(staffShopIds));

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

  // Keep active salon placements visible even when a formal sponsor standard
  // is not yet bound. Service observations are NOT competency approvals.
  const included = new Set(apprentices.map((item: any) => item.placementId));
  const remainingPlacements = (placements || []).filter((item: any) => !included.has(item.id));
  for (const placement of remainingPlacements) {
    const enrollment = enrollmentByPlacement.get(placement.id);
    if (!enrollment) continue;
    const profile: any = profileById.get(placement.student_id) || {};
    apprentices.push({
      placementId: placement.id, shopId: placement.shop_id, studentId: placement.student_id,
      enrollmentId: enrollment.id, programSlug: placement.program_slug,
      name: profile.full_name || profile.email || 'Assigned apprentice', email: profile.email || '',
      practiceOnly: true, completedCompetencies: 0, competencyRecords: [],
      standard: {
        occupationTitle: placement.program_slug === 'cosmetology-apprenticeship' ? 'Hair Stylist' : 'Assigned occupation',
        onetSocCode: '', rapidsCode: '', competencyCount: 0, relatedInstructionHours: 0,
        probationaryHours: 0, startingHourlyRate: 0, mentorHourlyRate: 0, wageMilestones: [], competencies: [],
      },
    });
  }
  return NextResponse.json({ apprentices });
}

// Formal approvals are performed through sponsor administration, never this Host Shop endpoint.
export async function PATCH() {
  return NextResponse.json({ error: 'Formal Appendix A sign-offs are restricted to sponsor administration.' }, { status: 403 });
}
