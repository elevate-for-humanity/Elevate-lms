import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getAppendixAStandard } from '@/lib/compliance/appendix-a-standards';

export const dynamic = 'force-dynamic';

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

  return { user, db, profile };
}

async function getAuthorizedShopIds(db: any, userId: string) {
  const { data } = await db
    .from('shop_staff')
    .select('shop_id')
    .eq('user_id', userId)
    .eq('active', true);
  return (data || []).map((row: any) => row.shop_id).filter(Boolean);
}

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { user, db, profile } = ctx;
  const privileged = ['admin', 'staff'].includes(profile?.role || '');
  const shopIds = await getAuthorizedShopIds(db, user.id);

  if (!privileged && shopIds.length === 0) {
    return NextResponse.json({ error: 'No active host-shop assignment found' }, { status: 403 });
  }

  let placementsQuery = db
    .from('apprentice_placements')
    .select('id, student_id, program_slug, shop_id, start_date, status')
    .eq('status', 'active');

  if (!privileged) placementsQuery = placementsQuery.in('shop_id', shopIds);
  const { data: placements, error: placementError } = await placementsQuery;
  if (placementError) return NextResponse.json({ error: placementError.message }, { status: 500 });

  const studentIds = Array.from(new Set((placements || []).map((row: any) => row.student_id).filter(Boolean)));
  if (studentIds.length === 0) return NextResponse.json({ apprentices: [] });

  const [{ data: profiles }, { data: enrollments }] = await Promise.all([
    db.from('profiles').select('id, full_name, email').in('id', studentIds),
    db
      .from('program_enrollments')
      .select('id, user_id, program_id, program_slug, status, created_at')
      .in('user_id', studentIds)
      .in('status', ['active', 'enrolled', 'in_progress'])
      .order('created_at', { ascending: false }),
  ]);

  const profileById = new Map((profiles || []).map((row: any) => [row.id, row]));
  const enrollmentByStudent = new Map<string, any>();
  for (const enrollment of enrollments || []) {
    const placement = (placements || []).find(
      (p: any) => p.student_id === enrollment.user_id && (!p.program_slug || !enrollment.program_slug || p.program_slug === enrollment.program_slug),
    );
    if (placement && !enrollmentByStudent.has(enrollment.user_id)) enrollmentByStudent.set(enrollment.user_id, enrollment);
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

  const { user, db, profile } = ctx;
  const body = await req.json();
  const enrollmentId = String(body.enrollmentId || '');
  const competencyId = String(body.competencyId || '');
  const completed = Boolean(body.completed);
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 4000) : null;

  if (!enrollmentId || !competencyId) {
    return NextResponse.json({ error: 'enrollmentId and competencyId are required' }, { status: 400 });
  }

  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('id, user_id, program_slug')
    .eq('id', enrollmentId)
    .maybeSingle();
  if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });

  const standard = getAppendixAStandard(enrollment.program_slug);
  if (!standard || !standard.competencies.some((item) => item.id === competencyId)) {
    return NextResponse.json({ error: 'Competency is not part of the approved Appendix A standard for this program' }, { status: 400 });
  }

  const privileged = ['admin', 'staff'].includes(profile?.role || '');
  if (!privileged) {
    const shopIds = await getAuthorizedShopIds(db, user.id);
    if (shopIds.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: placement } = await db
      .from('apprentice_placements')
      .select('id')
      .eq('student_id', enrollment.user_id)
      .eq('status', 'active')
      .in('shop_id', shopIds)
      .limit(1)
      .maybeSingle();
    if (!placement) return NextResponse.json({ error: 'You are not assigned to this apprentice' }, { status: 403 });
  }

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
