import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { BuiltCoursesPanel } from './BuiltCoursesPanel';
import { DashboardClientWrapper } from './DashboardClientWrapper';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Admin Dashboard | Elevate For Humanity',
};

async function getDashboardData(supabase: any, db: any) {
  const [
    studentsRes,
    programsRes,
    coursesRes,
    enrollmentsRes,
    certificatesRes,
    lessonsRes,
    partnersRes,
    atRiskRes,
    pendingEnrollmentsRes,
    pendingDocsRes,
    pendingAppsRes,
    allStudentsRes,
    allEnrollmentsRes,
    allProgramsRes,
    allCoursesRes,
    recentStudentsRes,
    topCoursesRes,
    recentApplicationsRes,
    activityLogRes,
    paymentsRes,
    blockedProgramsRes,
    inactiveLearnersRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('programs').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('program_enrollments').select('id', { count: 'exact', head: true }),
    supabase.from('certificates').select('id', { count: 'exact', head: true }),
    supabase.from('course_lessons').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'partner'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('enrollment_status', 'at_risk'),
    // Action Center counts
    supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('applications').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'pending', 'in_review']),
    // Full data for charts
    supabase.from('profiles').select('enrollment_status').eq('role', 'student'),
    supabase.from('program_enrollments').select('status, enrolled_at, progress, course_id'),
    supabase.from('programs').select('id, name, status'),
    supabase.from('courses').select('id, title, is_active'),
    // Recent students with their latest enrolled program name
    supabase.from('profiles')
      .select('id, full_name, email, enrollment_status, created_at, program_enrollments(program_id, programs(name))')
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('program_enrollments').select('course_id, status').limit(500),
    // Recent applications — newest 8
    supabase.from('applications')
      .select('id, first_name, last_name, full_name, email, program_interest, status, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    // Admin activity log — newest 10 events
    supabase.from('admin_activity_log')
      .select('id, action, details, timestamp')
      .order('timestamp', { ascending: false })
      .limit(10),
    // Payments — sum paid amount_cents
    supabase.from('payments')
      .select('amount_cents')
      .eq('status', 'paid'),
    // Programs blocking revenue — unpublished and incomplete
    supabase.from('programs')
      .select('id, title, slug, status, updated_at')
      .eq('published', false)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(8),
    // Inactive learners — enrolled but no lesson_progress update in 3+ days
    supabase.from('program_enrollments')
      .select('id, user_id, enrolled_at, profiles(id, full_name, email)')
      .eq('status', 'active')
      .lt('updated_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
      .order('updated_at', { ascending: true })
      .limit(8),
  ]);

  // Build enrollment trend by month
  const enrollmentsByMonth: Record<string, number> = {};
  for (const e of (allEnrollmentsRes.data || [])) {
    if (e.enrolled_at) {
      const m = new Date(e.enrolled_at).toISOString().slice(0, 7);
      enrollmentsByMonth[m] = (enrollmentsByMonth[m] || 0) + 1;
    }
  }

  // Student status distribution
  const studentStatuses: Record<string, number> = {};
  for (const s of (allStudentsRes.data || [])) {
    const st = s.enrollment_status || 'pending';
    studentStatuses[st] = (studentStatuses[st] || 0) + 1;
  }

  // Enrollment status distribution
  const enrollmentStatuses: Record<string, number> = {};
  for (const e of (allEnrollmentsRes.data || [])) {
    const st = e.status || 'unknown';
    enrollmentStatuses[st] = (enrollmentStatuses[st] || 0) + 1;
  }

  // Progress distribution
  const progressBuckets = { '0-25%': 0, '26-50%': 0, '51-75%': 0, '76-100%': 0 };
  for (const e of (allEnrollmentsRes.data || [])) {
    const p = e.progress || 0;
    if (p <= 25) progressBuckets['0-25%']++;
    else if (p <= 50) progressBuckets['26-50%']++;
    else if (p <= 75) progressBuckets['51-75%']++;
    else progressBuckets['76-100%']++;
  }

  // Program status
  const programStatuses: Record<string, number> = {};
  for (const p of (allProgramsRes.data || [])) {
    programStatuses[p.status || 'unknown'] = (programStatuses[p.status || 'unknown'] || 0) + 1;
  }

  // Course enrollment counts
  const courseEnrollments: Record<string, number> = {};
  for (const e of (topCoursesRes.data || [])) {
    if (e.course_id) {
      courseEnrollments[e.course_id] = (courseEnrollments[e.course_id] || 0) + 1;
    }
  }
  const courseMap: Record<string, string> = {};
  for (const c of (allCoursesRes.data || [])) {
    courseMap[c.id] = c.title;
  }
  const topCourses = Object.entries(courseEnrollments)
    .map(([id, count]) => ({ name: courseMap[id] || id.slice(0, 8), enrollments: count }))
    .sort((a, b) => b.enrollments - a.enrollments)
    .slice(0, 8);

  // Get user profile
  let profile = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();
      profile = data;
    }
  } catch { /* non-fatal */ }

  // Flatten program name onto each recent student row
  const recentStudents = (recentStudentsRes.data ?? []).map((s: any) => {
    const enrollment = Array.isArray(s.program_enrollments) ? s.program_enrollments[0] : null;
    const program = enrollment?.programs;
    return {
      id: s.id,
      full_name: s.full_name ?? null,
      email: s.email ?? null,
      enrollment_status: s.enrollment_status ?? null,
      created_at: s.created_at ?? null,
      program_name: (program as any)?.name ?? null,
    };
  });

  // Build real activity feed from admin_activity_log + recent applications + recent enrollments
  const activityItems: { id: string; label: string; created_at: string }[] = [];

  for (const row of activityLogRes.data ?? []) {
    const details = row.details as Record<string, string> | null;
    const who = details?.student_name || details?.name || details?.email || '';
    const what = details?.program || details?.program_name || '';
    const label = [row.action, who, what].filter(Boolean).join(' — ');
    activityItems.push({ id: `log-${row.id}`, label, created_at: row.timestamp });
  }

  // Supplement with recent applications if activity log is sparse
  if (activityItems.length < 5) {
    for (const app of recentApplicationsRes.data ?? []) {
      const name = [app.first_name, app.last_name].filter(Boolean).join(' ') || app.full_name || 'Applicant';
      activityItems.push({
        id: `app-${app.id}`,
        label: `${name} applied for ${app.program_interest || 'a program'}`,
        created_at: app.created_at,
      });
    }
  }

  // Supplement with recent enrollments
  if (activityItems.length < 8) {
    for (const s of recentStudents.slice(0, 5)) {
      activityItems.push({
        id: `enroll-${s.id}`,
        label: `${s.full_name || 'Student'} registered${(s as any).program_name ? ` — ${(s as any).program_name}` : ''}`,
        created_at: s.created_at ?? new Date().toISOString(),
      });
    }
  }

  const recentActivity = activityItems
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  const totalRevenueCents = (paymentsRes.data ?? [])
    .reduce((sum, row) => sum + Number(row.amount_cents ?? 0), 0);

  return {
    counts: {
      students: studentsRes.count ?? 0,
      programs: programsRes.count ?? 0,
      courses: coursesRes.count ?? 0,
      enrollments: enrollmentsRes.count ?? 0,
      certificates: certificatesRes.count ?? 0,
      lessons: lessonsRes.count ?? 0,
      partners: partnersRes.count ?? 0,
      atRisk: atRiskRes.count ?? 0,
      pendingEnrollments: pendingEnrollmentsRes.count ?? 0,
      pendingDocs: pendingDocsRes.count ?? 0,
      pendingApplications: pendingAppsRes.count ?? 0,
    },
    enrollmentsByMonth,
    studentStatuses,
    enrollmentStatuses,
    progressBuckets,
    programStatuses,
    topCourses,
    recentStudents,
    recentApplications: recentApplicationsRes.data ?? [],
    recentActivity,
    totalRevenueCents,
    profile,
    generatedAt: new Date().toISOString(),
    blockedPrograms: (blockedProgramsRes.data ?? []).map((p: any) => ({
      id: p.id,
      title: p.title ?? 'Untitled',
      slug: p.slug ?? '',
      status: p.status ?? 'draft',
      updatedAt: p.updated_at ?? '',
    })),
    inactiveLearners: (inactiveLearnersRes.data ?? []).map((e: any) => ({
      enrollmentId: e.id,
      userId: e.user_id,
      enrolledAt: e.enrolled_at ?? '',
      fullName: (e.profiles as any)?.full_name ?? null,
      email: (e.profiles as any)?.email ?? null,
    })),
  };
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const db = createAdminClient();

  const data = await getDashboardData(supabase, db);

  return (
    <>
      <DashboardClientWrapper data={data} />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <BuiltCoursesPanel />
      </div>
    </>
  );
}
