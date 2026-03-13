import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import DashboardClient from './DashboardClient';

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
    allStudentsRes,
    allEnrollmentsRes,
    allProgramsRes,
    allCoursesRes,
    recentStudentsRes,
    topCoursesRes,
  ] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    db.from('programs').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('training_courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }),
    db.from('certificates').select('id', { count: 'exact', head: true }),
    db.from('training_lessons').select('id', { count: 'exact', head: true }),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'partner'),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('enrollment_status', 'at_risk'),
    // Full data for charts
    db.from('profiles').select('enrollment_status').eq('role', 'student'),
    db.from('program_enrollments').select('status, enrolled_at, progress, course_id'),
    db.from('programs').select('id, name, status'),
    db.from('training_courses').select('id, course_name, is_active'),
    db.from('profiles').select('id, full_name, email, enrollment_status, created_at').eq('role', 'student').order('created_at', { ascending: false }).limit(10),
    db.from('program_enrollments').select('course_id, status').limit(500),
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
    courseMap[c.id] = c.course_name;
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
      const { data } = await db.from('profiles').select('full_name, role').eq('id', user.id).single();
      profile = data;
    }
  } catch { /* non-fatal */ }

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
    },
    enrollmentsByMonth,
    studentStatuses,
    enrollmentStatuses,
    progressBuckets,
    programStatuses,
    topCourses,
    recentStudents: recentStudentsRes.data ?? [],
    profile,
    generatedAt: new Date().toISOString(),
  };
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Database unavailable. Check Supabase configuration.</p>
      </div>
    );
  }

  const data = await getDashboardData(supabase, db);

  return (
    <>
      {/* Hero Image */}
      <DashboardClient data={data} />
    </>
  );
}
