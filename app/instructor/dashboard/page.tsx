import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { safeFormatDate } from '@/lib/format-utils';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import InstructorPerformanceDashboard from '@/components/InstructorPerformanceDashboard';

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
  description:
    'Manage your students, track progress, and oversee training programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/instructor/dashboard',
  },
};

export default async function ProgramHolderDashboard() {
  // Require instructor or admin role
  const { user, profile } = await requireRole([
    'instructor',
    'admin',
    'super_admin',
  ]);

  const supabase = await createClient();


  // Fetch courses assigned to this instructor, then get their enrollments
  const { data: myCourses } = await supabase
    .from('training_courses')
    .select('id')
    .eq('instructor_id', user.id);

  const courseIds = (myCourses || []).map((c: any) => c.id);

  const { data: students } = courseIds.length > 0
    ? await supabase
        .from('training_enrollments')
        .select(`*, profiles (id, full_name, email), programs (id, title, name, training_hours)`)
        .in('course_id', courseIds)
        .order('enrolled_at', { ascending: false })
        .limit(10)
    : { data: [] };

  // Calculate stats
  const totalStudents = students?.length || 0;
  const activeStudents =
    students?.filter((e) => e.status === 'active').length || 0;
  const completedStudents =
    students?.filter((e) => e.status === 'completed').length || 0;

  // Pending submissions needing review
  const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';
  let pendingQuery = supabase
    .from('step_submissions')
    .select('id', { count: 'exact', head: true })
    .in('status', ['submitted', 'under_review']);
  if (!isAdmin) pendingQuery = pendingQuery.eq('instructor_id', user.id);
  const { count: pendingSubmissions } = await pendingQuery;

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/instructor-page-8.jpg" alt="Instructor portal" fill sizes="100vw" className="object-cover" priority />
      </section>
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Instructor', href: '/instructor' }, { label: 'Dashboard' }]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">
                Instructor Dashboard
              </h1>
              <p className="text-black mt-1">
                Welcome back, {profile?.full_name || 'Instructor'}!
              </p>
            </div>
            <Link
              href="/instructor/students/new"
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
                <p className="text-base md:text-lg font-bold text-black">
                  {totalStudents}
                </p>
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
                <p className="text-base md:text-lg font-bold text-black">
                  {activeStudents}
                </p>
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
                <p className="text-base md:text-lg font-bold text-black">
                  {completedStudents}
                </p>
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
                  0
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
                <h2 className="text-xl font-bold text-black">
                  Recent Students
                </h2>
                <Link
                  href="/instructor/students"
                  className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium"
                >
                  View All
                </Link>
              </div>
              {students && students.length > 0 ? (
                <div className="space-y-4">
                  {students.slice(0, 5).map((student: Record<string, any>) => (
                    <div
                      key={student.id}
                      className="border border-slate-200 rounded-lg p-4 hover:border-brand-blue-300 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-black">
                            {student.profiles?.full_name || 'Unknown'}
                          </h3>
                          <p className="text-sm text-black">
                            {student.programs?.title || student.programs?.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {student.programs?.training_hours} hours
                          </p>
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
                            Started{' '}
                            {safeFormatDate(student.started_at || student.created_at)}
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
                    href="/instructor/students/new"
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
                  href="/instructor/submissions"
                  className="flex items-center justify-between w-full px-4 py-3 bg-brand-blue-50 hover:bg-brand-blue-100 rounded-lg border border-brand-blue-200 transition"
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList className="w-5 h-5 text-brand-blue-600 shrink-0" />
                    <div>
                      <p className="font-medium text-brand-blue-900">Review Submissions</p>
                      <p className="text-xs text-brand-blue-700">Labs &amp; assignments awaiting sign-off</p>
                    </div>
                  </div>
                  {(pendingSubmissions ?? 0) > 0 && (
                    <span className="ml-2 shrink-0 bg-brand-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {pendingSubmissions}
                    </span>
                  )}
                </Link>
                <Link
                  href="/instructor/students"
                  className="block w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                >
                  <p className="font-medium text-black">Manage Students</p>
                  <p className="text-xs text-slate-500">View and manage all students</p>
                </Link>
                <Link
                  href="/instructor/programs"
                  className="block w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                >
                  <p className="font-medium text-black">View Programs</p>
                  <p className="text-xs text-slate-500">Browse available programs</p>
                </Link>
                <Link
                  href="/instructor/settings"
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
                  <Link href="/instructor/courses" aria-label="Courses" className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm">Courses</Link>
                  <Link href="/instructor/students" aria-label="Students" className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm">Students</Link>
                  <Link href="/instructor/programs" aria-label="Programs" className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm">Programs</Link>
                  <Link href="/instructor/submissions" aria-label="Submissions" className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm flex items-center justify-between gap-1">
                    <span>Submissions</span>
                    {(pendingSubmissions ?? 0) > 0 && (
                      <span className="bg-brand-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">{pendingSubmissions}</span>
                    )}
                  </Link>
                  <Link href="/instructor/campaigns" aria-label="Campaigns" className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm">Campaigns</Link>
                  <Link href="/instructor/analytics" aria-label="Analytics" className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm">Analytics</Link>
                  <Link href="/instructor/settings" aria-label="Settings" className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm">Settings</Link>
                </div>
              </div>

              {/* Community & Announcements */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-black mb-4">Community</h3>
                <div className="space-y-2">
                  <Link 
                    href="/community" 
                    className="block w-full text-left px-4 py-3 bg-brand-blue-50 hover:bg-brand-blue-100 rounded-lg transition border border-brand-blue-200"
                  >
                    <p className="font-medium text-brand-blue-900">Community Hub</p>
                    <p className="text-xs text-brand-blue-700">Connect with students and instructors</p>
                  </Link>
                  <Link 
                    href="/lms/forums" 
                    className="block w-full text-left px-4 py-3 bg-brand-blue-50 hover:bg-brand-blue-100 rounded-lg transition border border-brand-blue-200"
                  >
                    <p className="font-medium text-brand-blue-900">Discussion Forums</p>
                    <p className="text-xs text-brand-blue-700">View and moderate discussions</p>
                  </Link>
                </div>
              </div>
            </div>

            {/* Instructor Performance */}
            <div className="mt-8">
              <InstructorPerformanceDashboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
