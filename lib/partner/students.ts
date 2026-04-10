import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

/**
 * Partner queries read enrollments/certificates for OTHER users (placed students).
 * RLS on enrollments is scoped to auth.uid() = user_id, which blocks cross-user reads.
 * We use the admin client (service role) here because access control is enforced
 * at the application layer via getMyPartnerContext() → shop scoping.
 * Falls back to session client if service role key is unavailable (dev environments).
 */
async function getPartnerClient() {
  try {
    return await getAdminClient();
  } catch {
    return await createClient();
  }
}

export interface PartnerStudent {
  student_id: string;
  student_name: string;
  student_email: string;
  shop_name: string;
  placement_status: string;
  placement_start: string | null;
}

export interface PartnerStudentWithTraining extends PartnerStudent {
  courses: {
    course_id: string;
    course_title: string;
    progress: number;
    status: string;
    enrolled_at: string;
    completed_at: string | null;
    credential_id: string | null;
  }[];
  certificate_count: number;
  overall_progress: number;
}

/**
 * Resolve the set of student IDs visible to a partner, scoped by their shops.
 * This is the single source of truth for partner → student access.
 */
export async function getPartnerStudentIds(shopIds: string[]): Promise<string[]> {
  if (!shopIds.length) return [];

  const supabase = await getPartnerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from('apprentice_placements')
    .select('student_id')
    .in('shop_id', shopIds);

  if (!data) return [];

  // Deduplicate — a student could be placed at multiple shops
  return [...new Set(data.map((d: any) => d.student_id).filter(Boolean))];
}

/**
 * Get partner's students with their training progress.
 * Joins: placements → profiles → enrollments → lesson_progress → certificates
 */
export async function getPartnerStudentsWithTraining(
  shopIds: string[]
): Promise<PartnerStudentWithTraining[]> {
  if (!shopIds.length) return [];

  const supabase = await getPartnerClient();
  if (!supabase) return [];

  // 1. Get placements with student profiles
  const { data: placements } = await supabase
    .from('apprentice_placements')
    .select(`
      student_id,
      status,
      start_date,
      shops!inner(name)
    `)
    .in('shop_id', shopIds);

  if (!placements?.length) return [];

  const studentIds = [...new Set(placements.map((p: any) => p.student_id).filter(Boolean))];

  // 2. Get student profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', studentIds);

  const profileMap = new Map(
    (profiles || []).map((p: any) => [p.id, p])
  );

  // 3. Get enrollments for these students
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select('id, user_id, course_id, progress, status, created_at, completed_at, courses!inner(title)')
    .in('user_id', studentIds);

  // 4. Get certificates with credential identifiers
  const { data: certificates } = await supabase
    .from('certificates')
    .select('user_id, course_id, certificate_number')
    .in('user_id', studentIds);

  const certCounts = new Map<string, number>();
  // Map: "userId:courseId" → certificate_number
  const certCodeMap = new Map<string, string>();
  (certificates || []).forEach((c: any) => {
    certCounts.set(c.user_id, (certCounts.get(c.user_id) || 0) + 1);
    if (c.course_id && c.certificate_number) {
      certCodeMap.set(`${c.user_id}:${c.course_id}`, c.certificate_number);
    }
  });

  // 5. Group enrollments by student
  const enrollmentsByStudent = new Map<string, any[]>();
  (enrollments || []).forEach((e: any) => {
    const list = enrollmentsByStudent.get(e.user_id) || [];
    list.push(e);
    enrollmentsByStudent.set(e.user_id, list);
  });

  // 6. Build result — one row per unique student
  const seen = new Set<string>();
  const results: PartnerStudentWithTraining[] = [];

  for (const placement of placements) {
    const sid = placement.student_id;
    if (!sid || seen.has(sid)) continue;
    seen.add(sid);

    const profile = profileMap.get(sid);
    const studentEnrollments = enrollmentsByStudent.get(sid) || [];
    const shop = (placement as any).shops;

    const courses = studentEnrollments.map((e: any) => ({
      course_id: e.course_id,
      course_title: (e.courses as any)?.title || 'Unknown Course',
      progress: e.progress || 0,
      status: e.status || 'active',
      enrolled_at: e.created_at,
      completed_at: e.completed_at,
      credential_id: certCodeMap.get(`${sid}:${e.course_id}`) || null,
    }));

    const totalProgress = courses.length > 0
      ? Math.round(courses.reduce((sum: number, c: any) => sum + c.progress, 0) / courses.length)
      : 0;

    results.push({
      student_id: sid,
      student_name: profile?.full_name || 'Unknown',
      student_email: profile?.email || '',
      shop_name: shop?.name || 'Unknown Shop',
      placement_status: placement.status || 'active',
      placement_start: placement.start_date,
      courses,
      certificate_count: certCounts.get(sid) || 0,
      overall_progress: totalProgress,
    });
  }

  return results;
}

/**
 * Get aggregate stats for partner dashboard.
 */
export async function getPartnerDashboardStats(shopIds: string[]) {
  if (!shopIds.length) {
    return {
      activeStudents: 0,
      totalEnrollments: 0,
      completedEnrollments: 0,
      completionRate: 0,
      certificatesIssued: 0,
      avgProgress: 0,
    };
  }

  const supabase = await getPartnerClient();
  if (!supabase) {
    return {
      activeStudents: 0,
      totalEnrollments: 0,
      completedEnrollments: 0,
      completionRate: 0,
      certificatesIssued: 0,
      avgProgress: 0,
    };
  }

  const studentIds = await getPartnerStudentIds(shopIds);
  if (!studentIds.length) {
    return {
      activeStudents: studentIds.length,
      totalEnrollments: 0,
      completedEnrollments: 0,
      completionRate: 0,
      certificatesIssued: 0,
      avgProgress: 0,
    };
  }

  const [enrollResult, certResult] = await Promise.all([
    supabase
      .from('program_enrollments')
      .select('status, progress')
      .in('user_id', studentIds),
    supabase
      .from('certificates')
      .select('id', { count: 'exact', head: true })
      .in('user_id', studentIds),
  ]);

  const enrollments = enrollResult.data || [];
  const total = enrollments.length;
  const completed = enrollments.filter((e: any) => e.status === 'completed').length;
  const avgProgress = total > 0
    ? Math.round(enrollments.reduce((sum: number, e: any) => sum + (e.progress || 0), 0) / total)
    : 0;

  return {
    activeStudents: studentIds.length,
    totalEnrollments: total,
    completedEnrollments: completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    certificatesIssued: certResult.count || 0,
    avgProgress,
  };
}
