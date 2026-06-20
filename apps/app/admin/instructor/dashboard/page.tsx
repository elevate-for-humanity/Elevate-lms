export const dynamic = 'force-dynamic';
import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { safeFormatDate } from '@/lib/format-utils';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  ClipboardList,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Instructor Dashboard | Elevate For Humanity',
  description: 'Manage your students, track progress, and oversee training programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/instructor/dashboard',
  },
};

export default async function InstructorDashboard() {
  // Require instructor or admin role
  const { user, profile } = await requireRole(['instructor', 'admin', 'super_admin']);

  const supabase = await createClient();

  // ── Legacy path: training_courses → training_enrollments (HVAC) ──────────
  const { data: myCourses } = await supabase
    .from('lms_courses')
    .select('id')
    .eq('instructor_id', user.id);

  const courseIds = (myCourses || []).map((c: any) => c.id);

  const { data: legacyStudents } =
    courseIds.length > 0
      ? await supabase
          .from('training_enrollments')
          .select(
            'id, status, enrolled_at, started_at, created_at, course_id, profiles (id, full_name, email), programs:training_courses (title, training_hours)',
          )
          .in('course_id', courseIds)
          .order('enrolled_at', { ascending: false })
          .limit(50)
      : { data: [] };

  // ── Current path: program_enrollments (all non-legacy programs) ───────────
  // Admins see all; instructors see programs where they are assigned.
  const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';
  let programEnrollQuery = supabase
    .from('program_enrollments')
    .select(
      'id, status, created_at, program_id, user_id, profiles (id, full_name, email), programs (title)',
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (!isAdmin) {
    // Scope to programs where this instructor is assigned
    const { data: assignedPrograms } = await supabase
      .from('program_instructors')
      .select('program_id')
      .eq('instructor_id', user.id);
    const assignedIds = (assignedPrograms || []).map((p: any) => p.program_id);
    if (assignedIds.length > 0) {
      programEnrollQuery = programEnrollQuery.in('program_id', assignedIds);
    }
    // If no assignments yet, instructor sees all enrollments until populated
  }

  const { data: currentStudents } = await programEnrollQuery;

  // ── Merge and deduplicate by profile id ──────────────────────────────────
  // Normalize both sources to a common shape for the UI
  type StudentRow = {
    id: string;
    status: string;
    started_at: string | null;
    created_at: string | null;
    profiles: { id: string; full_name: string | null; email: string | null } | null;
    programs: { title: string | null; training_hours?: number | null } | null;
    source: 'legacy' | 'current';
  };

  const legacyNorm: StudentRow[] = (legacyStudents || []).map((e: any) => ({
    id: e.id,
    status: e.status,
    started_at: e.started_at || e.enrolled_at || e.created_at,
    created_at: e.created_at,
    profiles: e.profiles,
    programs: e.programs,
    source: 'legacy',
  }));

  const currentNorm: StudentRow[] = (currentStudents || []).map((e: any) => ({
    id: e.id,
    status: e.status,
    started_at: e.created_at,
    created_at: e.created_at,
    profiles: e.profiles,
    programs: e.programs,
    source: 'current',
  }));

  // Deduplicate: if a user appears in both, prefer current enrollment
  const seenProfileIds = new Set<string>();
  const students: StudentRow[] = [];
  for (const row of [...currentNorm, ...legacyNorm]) {
    const pid = row.profiles?.id;
    if (pid && seenProfileIds.has(pid)) continue;
    if (pid) seenProfileIds.add(pid);
    students.push(row);
  }
  students.sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
  );

  // Calculate stats
  const totalStudents = students.length;
  const activeStudents = students.filter((e) => e.status === 'active').length;
  const completedStudents = students.filter((e) => e.status === 'completed').length;

  // Pending submissions needing review
  let pendingQuery = supabase
    .from('step_submissions')
    .select('id', { count: 'exact', head: true })
    .in('status', ['submitted', 'under_review']);
  if (!isAdmin) pendingQuery = pendingQuery.eq('instructor_id', user.id);
  const { count: pendingSubmissions } = await pendingQuery;

  // Course-level performance — aggregate from program_enrollments
  const { data: enrollmentRows } = await supabase
    .from('program_enrollments')
    .select('program_id, status, programs ( title )')
    .limit(200);

  const programMap: Record<string, { name: string; students: number; completed: number }> = {};
  for (const e of enrollmentRows ?? []) {
    const pid = e.program_id as string;
    const title = (e.programs as any)?.title ?? 'Unknown Program';
    if (!programMap[pid]) programMap[pid] = { name: title, students: 0, completed: 0 };
    programMap[pid].students++;
    if (e.status === 'completed') programMap[pid].completed++;
  }
  const coursePerformance = Object.values(programMap)
    .sort((a, b) => b.students - a.students)
    .slice(0, 5)
    .map((p) => ({
      name: p.name.length > 35 ? p.name.slice(0, 32) + '…' : p.name,
      students: p.students,
      completionRate: p.students > 0 ? Math.round((p.completed / p.students) * 100) : 0,
    }));

  // OJT reps awaiting supervisor verification
  const { data: pendingOjtReps } = await supabase
    .from('competency_log')
    .select('id, created_at, notes, profiles ( full_name, email )')
    .eq('supervisor_verified', false)
    .order('created_at', { ascending: false })
    .limit(10);

  // Barber sign-offs pending
  const { data: pendingSignoffs } = await supabase
    .from('barber_instructor_signoffs')
    .select('id, signoff_type, created_at, profiles ( full_name, email )')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10);

  // Hour summary for instructor-scoped students (top 10 by total hours)
  const { data: hourSummary } = await supabase
    .from('student_hour_summary')
    .select(
      'student_id, theory_hours, lab_hours, field_hours, total_approved_hours, total_pending_hours',
    )
    .order('total_approved_hours', { ascending: false })
    .limit(10);

  // Resolve names for hour summary rows
  const hourStudentIds = (hourSummary ?? []).map((r: any) => r.student_id).filter(Boolean);
  const hourProfileMap = new Map<string, string>();
  if (hourStudentIds.length > 0) {
    const { data: hourProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', hourStudentIds);
    (hourProfiles ?? []).forEach((p: any) => {
      hourProfileMap.set(p.id, p.full_name?.trim() || p.email || p.id.slice(0, 8) + '…');
    });
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image
          src="/images/pages/instructor-page-8.webp"
          alt="Instructor portal"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[{ label: 'Instructor', href: '/admin/instructor' }, { label: 'Dashboard' }]}
          />
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Instructor Dashboard</h1>
              <p className="text-black mt-1">Welcome back, {profile?.full_name || 'Instructor'}!</p>
            </div>
            <Link
              href="/admin/instructor/students/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition"
            >
              Add Student
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-blue-100 flex items-center justify-center">
                <Users className="text-brand-blue-600" size={24} />
              </div>
              <div>
                <p className="text-base md:text-lg font-bold text-black">{totalStudents}</p>
                <p className="text-sm text-black">Total Students</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-green-100 flex items-center justify-center">
                <span className="text-slate-500 flex-shrink-0">•</span>
              </div>
              <div>
                <p className="text-base md:text-lg font-bold text-black">{activeStudents}</p>
                <p className="text-sm text-black">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-blue-100 flex items-center justify-center">
                <Award className="text-brand-blue-600" size={24} />
              </div>
              <div>
                <p className="text-base md:text-lg font-bold text-black">{completedStudents}</p>
                <p className="text-sm text-black">Completed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-orange-100 flex items-center justify-center">
                <Clock className="text-brand-orange-600" size={24} />
              </div>
              <div>
                <p className="text-base md:text-lg font-bold text-black">
                  {pendingSubmissions ?? 0}
                </p>
                <p className="text-sm text-black">Pending Review</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Students List */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black">Recent Students</h2>
                <Link
                  href="/admin/instructor/students"
                  className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium"
                >
                  View All
                </Link>
              </div>
              {students && students.length > 0 ? (
                <div className="space-y-4">
                  {students.slice(0, 5).map((student) => (
                    <div
                      key={student.id}
                      className="border border-slate-200 rounded-lg p-4 hover:border-brand-blue-300 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-black">
                            {student.profiles?.full_name || 'Unknown'}
                          </h3>
                          <p className="text-sm text-black">{student.programs?.title ?? '—'}</p>
                          {student.programs?.training_hours && (
                            <p className="text-xs text-slate-500 mt-1">
                              {student.programs.training_hours} hours
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-3 py-2 rounded-full text-xs font-medium ${
                              student.status === 'active'
                                ? 'bg-brand-green-100 text-brand-green-700'
                                : student.status === 'completed'
                                  ? 'bg-brand-blue-100 text-brand-blue-700'
                                  : 'bg-white text-black'
                            }`}
                          >
                            {student.status}
                          </span>
                          <p className="text-xs text-slate-500 mt-2">
                            Started {safeFormatDate(student.started_at || student.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-black mb-4">No students yet</p>
                  <Link
                    href="/admin/instructor/students/new"
                    className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                  >
                    Add Your First Student
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-black mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {/* Submissions — shown prominently with pending count */}
                <Link
                  href="/admin/instructor/submissions"
                  className="flex items-center justify-between w-full px-4 py-3 bg-brand-blue-50 hover:bg-brand-blue-100 rounded-lg border border-brand-blue-200 transition"
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList className="w-5 h-5 text-brand-blue-600 shrink-0" />
                    <div>
                      <p className="font-medium text-brand-blue-900">Review Submissions</p>
                      <p className="text-xs text-brand-blue-700">
                        Labs &amp; assignments awaiting sign-off
                      </p>
                    </div>
                  </div>
                  {(pendingSubmissions ?? 0) > 0 && (
                    <span className="ml-2 shrink-0 bg-brand-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {pendingSubmissions}
                    </span>
                  )}
                </Link>
                <Link
                  href="/admin/instructor/students"
                  className="block w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                >
                  <p className="font-medium text-black">Manage Students</p>
                  <p className="text-xs text-slate-500">View and manage all students</p>
                </Link>
                <Link
                  href="/admin/instructor/programs"
                  className="block w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                >
                  <p className="font-medium text-black">View Programs</p>
                  <p className="text-xs text-slate-500">Browse available programs</p>
                </Link>
                <Link
                  href="/admin/instructor/settings"
                  className="block w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                >
                  <p className="font-medium text-black">Settings</p>
                  <p className="text-xs text-slate-500">Update your profile</p>
                </Link>
              </div>

              {/* All Instructor Features */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-black mb-4">Instructor Tools</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Link
                    href="/admin/instructor/courses"
                    aria-label="Courses"
                    className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
                  >
                    Courses
                  </Link>
                  <Link
                    href="/admin/instructor/students"
                    aria-label="Students"
                    className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
                  >
                    Students
                  </Link>
                  <Link
                    href="/admin/instructor/programs"
                    aria-label="Programs"
                    className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
                  >
                    Programs
                  </Link>
                  <Link
                    href="/admin/instructor/submissions"
                    aria-label="Submissions"
                    className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm flex items-center justify-between gap-1"
                  >
                    <span>Submissions</span>
                    {(pendingSubmissions ?? 0) > 0 && (
                      <span className="bg-brand-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {pendingSubmissions}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/admin/instructor/campaigns"
                    aria-label="Campaigns"
                    className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
                  >
                    Campaigns
                  </Link>
                  <Link
                    href="/admin/instructor/analytics"
                    aria-label="Analytics"
                    className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
                  >
                    Analytics
                  </Link>
                  <Link
                    href="/admin/instructor/settings"
                    aria-label="Settings"
                    className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
                  >
                    Settings
                  </Link>
                </div>
              </div>


            </div>

            {/* Course Performance */}
            {coursePerformance.length > 0 && (
              <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-bold text-black mb-4">Course Performance</h3>
                <div className="space-y-4">
                  {coursePerformance.map((c, i) => (
                    <div key={i}>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-sm font-medium text-slate-800 truncate max-w-[60%]">
                          {c.name}
                        </span>
                        <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                          {c.students} enrolled · {c.completionRate}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-blue-500"
                          style={{ width: `${c.completionRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OJT Sign-Off Queue */}
            {((pendingOjtReps?.length ?? 0) > 0 || (pendingSignoffs?.length ?? 0) > 0) && (
              <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-amber-200">
                <h3 className="font-bold text-black mb-4 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-600" />
                  OJT &amp; Sign-Off Queue
                </h3>
                {(pendingOjtReps?.length ?? 0) > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                      Unverified OJT Reps
                    </p>
                    <div className="space-y-2">
                      {pendingOjtReps!.map((rep: any) => (
                        <div
                          key={rep.id}
                          className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-slate-800">
                            {rep.profiles?.full_name ?? rep.profiles?.email ?? 'Student'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {safeFormatDate(rep.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(pendingSignoffs?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                      Pending Module Sign-Offs
                    </p>
                    <div className="space-y-2">
                      {pendingSignoffs!.map((s: any) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-slate-800">
                            {s.profiles?.full_name ?? s.profiles?.email ?? 'Student'}
                          </span>
                          <span className="text-xs text-slate-400 capitalize">
                            {s.signoff_type?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Student Hour Summary */}
            {(hourSummary?.length ?? 0) > 0 && (
              <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-bold text-black mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-blue-600" />
                  Student Hour Summary
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 border-b">
                        <th className="text-left pb-2 font-medium">Student</th>
                        <th className="text-right pb-2 font-medium">Theory</th>
                        <th className="text-right pb-2 font-medium">Lab</th>
                        <th className="text-right pb-2 font-medium">Field</th>
                        <th className="text-right pb-2 font-medium">Approved</th>
                        <th className="text-right pb-2 font-medium">Pending</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {hourSummary!.map((row: any) => (
                        <tr key={row.student_id}>
                          <td className="py-2 text-slate-700 font-medium truncate max-w-[160px]">
                            {hourProfileMap.get(row.student_id) ?? row.student_id.slice(0, 8) + '…'}
                          </td>
                          <td className="py-2 text-right text-slate-600">
                            {Number(row.theory_hours ?? 0).toFixed(1)}
                          </td>
                          <td className="py-2 text-right text-slate-600">
                            {Number(row.lab_hours ?? 0).toFixed(1)}
                          </td>
                          <td className="py-2 text-right text-slate-600">
                            {Number(row.field_hours ?? 0).toFixed(1)}
                          </td>
                          <td className="py-2 text-right font-semibold text-green-700">
                            {Number(row.total_approved_hours ?? 0).toFixed(1)}
                          </td>
                          <td className="py-2 text-right text-amber-600">
                            {Number(row.total_pending_hours ?? 0).toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
