import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import WorkOneChecklistSection from '@/components/workone/WorkOneChecklist';
import {
  Clock,
  Play,
  MessageSquare,
  Bell,
  ChevronRight,
  Trophy,
  BookOpen,
  Video,
  BarChart3,
  HelpCircle,
  GraduationCap,
  Award,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Learner Dashboard | Elevate LMS',
  description: 'Your learning dashboard - track progress, view courses, and manage your training.',
};

export const dynamic = 'force-dynamic';

export default async function LearnerDashboardPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login?redirect=/learner/dashboard');
  }

  // Fetch profile
  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch enrollments from both tables (legacy enrollments + training_enrollments)
  const { data: legacyEnrollments } = await db
    .from('enrollments')
    .select(`
      id,
      course_id,
      status,
      progress,
      enrolled_at,
      courses (
        id,
        title,
        description,
        duration_hours
      )
    `)
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false });

  const { data: trainingEnrollments } = await db
    .from('training_enrollments')
    .select(`
      id,
      course_id,
      status,
      progress,
      enrolled_at,
      training_courses (
        id,
        course_name,
        description,
        duration_hours
      )
    `)
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false });

  // Normalize training_enrollments to match legacy shape
  const normalizedTraining = (trainingEnrollments || []).map((te: any) => ({
    ...te,
    courses: te.training_courses
      ? { id: te.training_courses.id, title: te.training_courses.course_name, description: te.training_courses.description, duration_hours: te.training_courses.duration_hours }
      : null,
  }));

  // Merge, dedup by course_id
  const seen = new Set<string>();
  const enrollments = [...(legacyEnrollments || []), ...normalizedTraining].filter((e: any) => {
    const key = e.course_id || e.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Fetch achievements
  const { data: achievements } = await db
    .from('user_achievements')
    .select(`
      id,
      earned_at,
      achievements (
        id,
        name,
        description,
        icon
      )
    `)
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })
    .limit(5);

  // Fetch notifications
  const { data: notifications } = await db
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch certificates
  const { data: certificates } = await db
    .from('certificates')
    .select('id, certificate_number, course_title, issued_at, verification_code')
    .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
    .order('issued_at', { ascending: false })
    .limit(5);

  // Fetch attendance hours
  const { data: attendanceData } = await db
    .from('attendance_hours')
    .select('hours_logged, date, type')
    .eq('enrollment_id', enrollments?.[0]?.id || '00000000-0000-0000-0000-000000000000')
    .order('date', { ascending: false })
    .limit(30);

  // Fetch training hours (fallback)
  const { data: hoursData } = await db
    .from('training_hours')
    .select('hours')
    .eq('user_id', user.id);

  const attendanceHours = attendanceData?.reduce((sum, a) => sum + (a.hours_logged || 0), 0) || 0;
  const trainingHours = hoursData?.reduce((sum, h) => sum + (h.hours || 0), 0) || 0;
  const totalHours = attendanceHours || trainingHours;

  // Fetch lesson progress for all enrolled courses
  const courseIds = enrollments?.map(e => e.course_id).filter(Boolean) || [];
  const { data: lessonProgress } = courseIds.length > 0
    ? await db
        .from('lesson_progress')
        .select('course_id, lesson_id, completed')
        .eq('user_id', user.id)
        .in('course_id', courseIds)
    : { data: null };

  // Check for pending onboarding (program_enrollments in pre-active state)
  const { data: pendingOnboarding } = await db
    .from('program_enrollments')
    .select('id, enrollment_state, next_required_action, full_name, program_id')
    .eq('user_id', user.id)
    .in('enrollment_state', ['applied', 'approved', 'confirmed', 'orientation_complete', 'documents_complete'])
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Calculate stats
  const activeEnrollments = enrollments?.filter(e => e.status === 'active') || [];
  const completedEnrollments = enrollments?.filter(e => e.status === 'completed') || [];
  const averageProgress = activeEnrollments.length > 0
    ? Math.round(activeEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / activeEnrollments.length)
    : 0;

  const userName = profile?.full_name || user.email?.split('@')[0] || 'Learner';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Elevate LMS
              </Link>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600">Learner Portal</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700">
                <Bell className="w-5 h-5" />
                {notifications && notifications.length > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-brand-red-500 rounded-full" />
                )}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-brand-orange-600 font-medium text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">{userName}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userName}!
          </h1>
          <p className="text-gray-600">
            Continue your learning journey. You&apos;re making great progress!
          </p>
        </div>

        {/* Onboarding Banner — shown when student has a pending program enrollment */}
        {pendingOnboarding && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-amber-900 mb-1">Complete Your Onboarding</h2>
                <p className="text-amber-800 text-sm">
                  {pendingOnboarding.enrollment_state === 'approved' && 'Confirm your enrollment to proceed to orientation.'}
                  {pendingOnboarding.enrollment_state === 'confirmed' && 'Complete your orientation to unlock document upload.'}
                  {pendingOnboarding.enrollment_state === 'orientation_complete' && 'Upload your required documents to activate your enrollment.'}
                  {pendingOnboarding.enrollment_state === 'documents_complete' && 'Your documents are being reviewed. You\'ll be activated shortly.'}
                  {pendingOnboarding.enrollment_state === 'applied' && 'Your application is being reviewed. We\'ll notify you when it\'s approved.'}
                </p>
              </div>
              <Link
                href={
                  pendingOnboarding.enrollment_state === 'approved' ? '/enrollment/confirmed' :
                  pendingOnboarding.enrollment_state === 'confirmed' ? '/enrollment/orientation' :
                  pendingOnboarding.enrollment_state === 'orientation_complete' ? '/enrollment/documents' :
                  '/enrollment/confirmed'
                }
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap"
              >
                {pendingOnboarding.enrollment_state === 'approved' && 'Confirm Enrollment'}
                {pendingOnboarding.enrollment_state === 'confirmed' && 'Start Orientation'}
                {pendingOnboarding.enrollment_state === 'orientation_complete' && 'Upload Documents'}
                {pendingOnboarding.enrollment_state === 'documents_complete' && 'View Status'}
                {pendingOnboarding.enrollment_state === 'applied' && 'View Status'}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Programs</p>
                <p className="text-2xl font-bold text-gray-900">{activeEnrollments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <span className="text-slate-400 flex-shrink-0">•</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedEnrollments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-brand-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Training Hours</p>
                <p className="text-2xl font-bold text-gray-900">{totalHours}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Progress</p>
                <p className="text-2xl font-bold text-gray-900">{averageProgress}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Programs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Programs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">My Programs</h2>
                  <Link href="/programs" className="text-sm text-brand-orange-600 hover:text-brand-orange-700 font-medium">
                    Browse All Programs
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {activeEnrollments.length > 0 ? (
                  activeEnrollments.map((enrollment: any) => {
                    const course = Array.isArray(enrollment.courses) ? enrollment.courses[0] : enrollment.courses;
                    return (
                    <div key={enrollment.id} className="p-6">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <div className="w-full h-full flex items-center justify-center">
                              <GraduationCap className="w-8 h-8 text-gray-400" />
                            </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {course?.title || 'Course'}
                          </h3>
                          <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                            {course?.description || 'No description available'}
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-500">Progress</span>
                                <span className="font-medium text-gray-900">{enrollment.progress || 0}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-brand-orange-500 h-2 rounded-full transition-all"
                                  style={{ width: `${enrollment.progress || 0}%` }}
                                />
                              </div>
                            </div>
                            <Link
                              href={`/courses/${enrollment.course_id}/learn`}
                              className="px-4 py-2 bg-brand-orange-600 text-white text-sm font-medium rounded-lg hover:bg-brand-orange-700 transition flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Continue
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );})
                  
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Programs</h3>
                    <p className="text-gray-500 mb-4">Start your learning journey by enrolling in a program.</p>
                    <Link
                      href="/programs"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange-600 text-white font-medium rounded-lg hover:bg-brand-orange-700 transition"
                    >
                      Browse Programs
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                  href="/lms"
                  className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <Video className="w-8 h-8 text-brand-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700">My Courses</span>
                </Link>
                <Link
                  href="/certificates"
                  className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <Award className="w-8 h-8 text-brand-green-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Certificates</span>
                </Link>
                <Link
                  href="/achievements"
                  className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <Trophy className="w-8 h-8 text-yellow-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Achievements</span>
                </Link>
                <Link
                  href="/contact"
                  className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <HelpCircle className="w-8 h-8 text-brand-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Get Help</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* WorkOne Checklist */}
            <WorkOneChecklistSection />

            {/* Achievements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Achievements</h2>
                  <Link href="/achievements" className="text-sm text-brand-orange-600 hover:text-brand-orange-700">
                    View All
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {achievements && achievements.length > 0 ? (
                  <div className="space-y-4">
                    {achievements.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {item.achievements?.name || 'Achievement'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.earned_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Complete courses to earn achievements!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              </div>
              <div className="p-6">
                {notifications && notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.map((notification: any) => (
                      <div key={notification.id} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-brand-orange-500 rounded-full mt-2" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{notification.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-2">{notification.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No new notifications</p>
                  </div>
                )}
              </div>
            </div>

            {/* Resources */}
            <div className="bg-brand-orange-500 rounded-xl p-6 text-white">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-brand-orange-100 mb-4">
                Our support team is here to help you succeed in your training.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-brand-orange-600 font-medium rounded-lg hover:bg-brand-orange-50 transition text-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Contact Support
              </Link>
            </div>

            {/* Certificates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Certificates</h2>
                  <Link href="/certificates" className="text-sm text-brand-orange-600 hover:text-brand-orange-700">
                    View All
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {certificates && certificates.length > 0 ? (
                  <div className="space-y-4">
                    {certificates.map((cert: any) => (
                      <div key={cert.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-green-100 rounded-full flex items-center justify-center">
                          <Award className="w-5 h-5 text-brand-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {cert.course_title || 'Certificate'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {cert.certificate_number} &middot; {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Complete courses to earn certificates</p>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Attendance</h2>
              </div>
              <div className="p-6">
                {attendanceData && attendanceData.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Hours Logged</span>
                      <span className="font-semibold text-gray-900">{attendanceHours.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Sessions This Month</span>
                      <span className="font-semibold text-gray-900">
                        {attendanceData.filter((a: any) => {
                          const d = new Date(a.date);
                          const now = new Date();
                          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        }).length}
                      </span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs text-gray-500 mb-2">Recent Sessions</p>
                      {attendanceData.slice(0, 3).map((a: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs py-1">
                          <span className="text-gray-600">{new Date(a.date).toLocaleDateString()}</span>
                          <span className="text-gray-900 font-medium">{a.hours_logged}h ({a.type})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No attendance records yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
