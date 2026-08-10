import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getAppendixAStandard } from '@/lib/compliance/appendix-a-standards';

export const dynamic = 'force-dynamic';

const HOST_SHOP_ADMIN_COOKIE = '__efh_host_shop_partner';
const PLATFORM_ADMIN_ROLES = new Set(['admin', 'super_admin', 'org_admin']);
const HOST_SHOP_API_ROLES = new Set([
  'admin',
  'super_admin',
  'org_admin',
  'partner',
  'host_shop',
  'host_shop_admin',
  'program_holder',
]);

function initials(name: string | null | undefined) {
  return (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  const role = String(profile?.role || '').trim().toLowerCase();
  if (!HOST_SHOP_API_ROLES.has(role)) return null;

  return { user, db, profile, role };
}

async function getAuthorizedShopIds(db: any, userId: string, role: string) {
  const { data: staffRows } = await db
    .from('shop_staff')
    .select('shop_id, active, shops:shops!inner(id, active, partner_id)')
    .eq('user_id', userId)
    .eq('active', true)
    .eq('shops.active', true);

  const staffShopIds = (staffRows || []).map((row: any) => row.shop_id).filter(Boolean);
  if (staffShopIds.length) return Array.from(new Set(staffShopIds));

  let partnerId: string | null = null;
  if (PLATFORM_ADMIN_ROLES.has(role)) {
    const cookieStore = await cookies();
    partnerId = cookieStore.get(HOST_SHOP_ADMIN_COOKIE)?.value || null;
  } else {
    const { data: partnerUser } = await db
      .from('partner_users')
      .select('partner_id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    partnerId = partnerUser?.partner_id || null;
  }

  if (!partnerId) return [];

  const { data: partner } = await db
    .from('partners')
    .select('id, status, approval_status, is_active')
    .eq('id', partnerId)
    .maybeSingle();

  if (
    !partner ||
    partner.status !== 'active' ||
    partner.approval_status !== 'approved' ||
    partner.is_active === false
  ) {
    return [];
  }

  const { data: shops } = await db
    .from('shops')
    .select('id')
    .eq('partner_id', partnerId)
    .eq('active', true);

  return (shops || []).map((shop: any) => shop.id).filter(Boolean);
}

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { user, db, role } = ctx;
  const shopIds = await getAuthorizedShopIds(db, user.id, role);
  if (shopIds.length === 0) {
    return NextResponse.json({ error: 'No active Host Shop assignment found' }, { status: 403 });
  }

  const { data: placements, error: placementError } = await db
    .from('apprentice_placements')
    .select('id, student_id, program_slug, shop_id, start_date, status')
    .in('shop_id', shopIds)
    .eq('status', 'active');

  if (placementError) return NextResponse.json({ error: placementError.message }, { status: 500 });

  const studentIds = Array.from(new Set((placements || []).map((row: any) => row.student_id).filter(Boolean)));
  if (studentIds.length === 0) return NextResponse.json({ apprentices: [] });

  const [{ data: profiles }, { data: enrollments }] = await Promise.all([
    db.from('profiles').select('id, full_name, email').in('id', studentIds),
    db
      .from('program_enrollments')
      .select('id, user_id, student_id, program_id, program_slug, status, created_at')
      .or(`user_id.in.(${studentIds.join(',')}),student_id.in.(${studentIds.join(',')})`)
      .in('status', ['active', 'enrolled', 'in_progress'])
      .order('created_at', { ascending: false }),
  ]);

  const profileById = new Map((profiles || []).map((row: any) => [row.id, row]));
  const enrollmentByStudent = new Map<string, any>();
  for (const enrollment of enrollments || []) {
    const enrollmentStudentId = enrollment.user_id || enrollment.student_id;
    const placement = (placements || []).find(
      (item: any) =>
        item.student_id === enrollmentStudentId &&
        (!item.program_slug || !enrollment.program_slug || item.program_slug === enrollment.program_slug),
    );
    if (placement && !enrollmentByStudent.has(enrollmentStudentId)) {
      enrollmentByStudent.set(enrollmentStudentId, enrollment);
    }
  }

  const enrollmentIds = Array.from(enrollmentByStudent.values()).map((row: any) => row.id);
  const { data: records } = enrollmentIds.length
    ? await db
        .from('apprentice_competency_records')
        .select('id, enrollment_id, competency_id, completed, date_completed, verified_by, verified_by_name, notes, updated_at')
        .in('enrollment_id', enrollmentIds)
    : { data: [] };

  const recordsByEnrollment = new Map<string, any[]>();
  for (const record of records || []) {
    const bucket = recordsByEnrollment.get(record.enrollment_id) || [];
    bucket.push(record);
    recordsByEnrollment.set(record.enrollment_id, bucket);
  }

  const apprentices = (placements || [])
    .map((placement: any) => {
      const enrollment = enrollmentByStudent.get(placement.student_id);
      const programSlug = enrollment?.program_slug || placement.program_slug;
      const standard = getAppendixAStandard(programSlug);
      if (!enrollment || !standard) return null;

      const apprenticeProfile: any = profileById.get(placement.student_id) || {};
      const competencyRecords = recordsByEnrollment.get(enrollment.id) || [];
      const completed = competencyRecords.filter((row: any) => row.completed).length;

      return {
        placementId: placement.id,
        shopId: placement.shop_id,
        studentId: placement.student_id,
        enrollmentId: enrollment.id,
        programSlug,
        name: apprenticeProfile.full_name || apprenticeProfile.email || 'Apprentice',
        email: apprenticeProfile.email || '',
        standard,
        completedCompetencies: completed,
        competencyRecords,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ apprentices });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { user, db, profile, role } = ctx;
  const body = await req.json().catch(() => null);
  const enrollmentId = typeof body?.enrollmentId === 'string' ? body.enrollmentId.trim() : '';
  const competencyId = typeof body?.competencyId === 'string' ? body.competencyId.trim() : '';
  const completed = Boolean(body?.completed);
  const notes = typeof body?.notes === 'string' ? body.notes.trim().slice(0, 4000) : null;

  if (!enrollmentId || !competencyId) {
    return NextResponse.json({ error: 'enrollmentId and competencyId are required' }, { status: 400 });
  }

  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('id, user_id, student_id, program_slug')
    .eq('id', enrollmentId)
    .maybeSingle();
  if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });

  const standard = getAppendixAStandard(enrollment.program_slug);
  if (!standard || !standard.competencies.some((item) => item.id === competencyId)) {
    return NextResponse.json({ error: 'Competency is not part of the approved Appendix A standard for this program' }, { status: 400 });
  }

  const studentId = enrollment.user_id || enrollment.student_id;
  if (!studentId) return NextResponse.json({ error: 'Enrollment has no student identity' }, { status: 400 });

  const shopIds = await getAuthorizedShopIds(db, user.id, role);
  if (shopIds.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: placement } = await db
    .from('apprentice_placements')
    .select('id')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .in('shop_id', shopIds)
    .limit(1)
    .maybeSingle();
  if (!placement) return NextResponse.json({ error: 'You are not assigned to this apprentice' }, { status: 403 });

  const verifiedName = profile?.full_name || profile?.email || user.email || 'Verified mentor';
  const today = new Date().toISOString().slice(0, 10);

  const { data: record, error } = await db
    .from('apprentice_competency_records')
    .upsert(
      {
        enrollment_id: enrollmentId,
        competency_id: competencyId,
        completed,
        date_completed: completed ? today : null,
        verified_by: user.id,
        verified_by_name: verifiedName,
        notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'enrollment_id,competency_id' },
    )
    .select('id, enrollment_id, competency_id, completed, date_completed, verified_by, verified_by_name, notes, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record, verifierInitials: initials(verifiedName) });
}
