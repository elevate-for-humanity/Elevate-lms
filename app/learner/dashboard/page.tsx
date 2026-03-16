import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Image from 'next/image';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
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
  CheckCircle,
  Upload,
  ExternalLink,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Learner Dashboard | Elevate LMS',
  description: 'Your learning dashboard - track progress, view courses, and manage your training.',
};

export const dynamic = 'force-dynamic';

export default async function LearnerDashboardPage() {
  // Require student role (admins can view for support)
  const { user, profile } = await requireRole(['student', 'admin', 'super_admin']);

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  // Fetch enrollments from both tables (legacy enrollments + training_enrollments)
  const { data: legacyEnrollments } = await db
    .from('program_enrollments')
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

  // Fetch active certification requests for the pipeline section
  const { data: certRequests } = await db
    .from('certification_requests')
    .select(`
      id, status, authorization_code, authorization_expires_at,
      certificate_issued_at, created_at,
      programs ( title ),
      credential_registry ( name, abbreviation ),
      program_certification_pathways (
        credential_name, credential_abbreviation,
        eligibility_review_required, application_url,
        fee_payer, exam_fee_cents,
        certification_bodies ( name, website )
      )
    `)
    .eq('user_id', user.id)
    .neq('status', 'pending_completion')
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch attendance hours
  const { data: attendanceData } = await db
    .from('attendance_hours')
    .select('hours_logged, date, type')
    .eq('enrollment_id', enrollments?.[0]?.id || '00000000-0000-0000-0000-000000000000')
    .order('date', { ascending: false })
    .limit(30);

  // Fetch training hours from consolidated hour_entries
  const { data: hoursData } = await db
    .from('hour_entries')
    .select('hours_claimed')
    .eq('user_id', user.id);

  const attendanceHours = attendanceData?.reduce((sum, a) => sum + (a.hours_logged || 0), 0) || 0;
  const trainingHours = hoursData?.reduce((sum, h) => sum + (Number(h.hours_claimed) || 0), 0) || 0;
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
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/learner-page-1.jpg" alt="Learning dashboard" fill sizes="100vw" className="object-cover" priority />
      </section>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Elevate LMS
              </Link>
              <span className="text-slate-600">|</span>
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
                <span className="text-slate-500 flex-shrink-0">•</span>
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
                        <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
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
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
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
                  href="/learner/dashboard"
                  className="flex flex-col items-center p-4 bg-white rounded-lg hover:bg-white transition"
                >
                  <Video className="w-8 h-8 text-brand-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700">My Courses</span>
                </Link>
                <Link
                  href="/certificates"
                  className="flex flex-col items-center p-4 bg-white rounded-lg hover:bg-white transition"
                >
                  <Award className="w-8 h-8 text-brand-green-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Certificates</span>
                </Link>
                <Link
                  href="/achievements"
                  className="flex flex-col items-center p-4 bg-white rounded-lg hover:bg-white transition"
                >
                  <Trophy className="w-8 h-8 text-yellow-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Achievements</span>
                </Link>
                <Link
                  href="/contact"
                  className="flex flex-col items-center p-4 bg-white rounded-lg hover:bg-white transition"
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
                        <div className="w-2 h-2 bg-white rounded-full mt-2" />
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
            <div className="bg-white rounded-xl p-6 text-white">
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

            {/* Certification Pipeline */}
            {certRequests && certRequests.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Certification Progress</h2>
                    <Link href="/learner/certifications" className="text-sm text-brand-orange-600 hover:text-brand-orange-700">
                      View All
                    </Link>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  {certRequests.map((req: any) => {
                    const pathway = req.program_certification_pathways;
                    const body = pathway?.certification_bodies;
                    const credName = pathway?.credential_name ?? req.credential_registry?.name ?? 'Certification';
                    const credAbbr = pathway?.credential_abbreviation ?? req.credential_registry?.abbreviation ?? '';

                    // Step indicators
                    const steps = [
                      { key: 'training',   label: 'Training Complete',        done: true },
                      { key: 'payment',    label: 'Exam Fee Paid',            done: ['exam_authorized','exam_forwarded','awaiting_upload','upload_pending','upload_rejected','certificate_issued'].includes(req.status) },
                      { key: 'authorized', label: 'Exam Authorization Sent',  done: ['exam_forwarded','awaiting_upload','upload_pending','upload_rejected','certificate_issued'].includes(req.status) },
                      { key: 'upload',     label: 'Result Uploaded',          done: ['upload_pending','certificate_issued'].includes(req.status) },
                      { key: 'issued',     label: 'Certificate Issued',       done: req.status === 'certificate_issued' },
                    ];

                    return (
                      <div key={req.id} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{credName}</p>
                            <p className="text-xs text-gray-500">{req.programs?.title}</p>
                            {body && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                Issued by: {body.name}
                              </p>
                            )}
                          </div>
                          {credAbbr && (
                            <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {credAbbr}
                            </span>
                          )}
                        </div>

                        {/* Step progress */}
                        <ol className="space-y-1.5 mb-4">
                          {steps.map((step) => (
                            <li key={step.key} className="flex items-center gap-2 text-xs">
                              {step.done
                                ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />
                              }
                              <span className={step.done ? 'text-gray-700' : 'text-gray-400'}>
                                {step.label}
                              </span>
                            </li>
                          ))}
                        </ol>

                        {/* Contextual action for current status */}
                        {req.status === 'awaiting_payment' && (
                          <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 rounded p-2">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            Exam fee processing — you will receive an email when your authorization is ready.
                          </div>
                        )}

                        {req.status === 'payment_failed' && (
                          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 rounded p-2">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            Payment issue — contact Elevate at (317) 314-3757.
                          </div>
                        )}

                        {(req.status === 'exam_authorized' || req.status === 'exam_forwarded') && (
                          <div className="text-xs text-brand-blue-700 bg-brand-blue-50 rounded p-2 space-y-1">
                            <p className="font-medium">Your exam authorization is on its way.</p>
                            <p className="text-brand-blue-600">Check your email for instructions from Elevate staff.</p>
                            {req.authorization_expires_at && (
                              <p className="text-gray-500">
                                Authorization expires: {new Date(req.authorization_expires_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}

                        {(req.status === 'awaiting_upload' || req.status === 'upload_rejected') && (
                          <div className="space-y-2">
                            {req.status === 'upload_rejected' && (
                              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 rounded p-2">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                Your upload was not accepted. Please re-upload a clear copy of your certificate.
                              </div>
                            )}
                            <Link
                              href={`/learner/certifications/${req.id}/upload`}
                              className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-brand-blue-600 text-white text-xs font-medium rounded-lg hover:bg-brand-blue-700"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Upload Your Certificate
                            </Link>
                          </div>
                        )}

                        {req.status === 'upload_pending' && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
                            <FileCheck className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                            Certificate uploaded — Elevate is reviewing it. You will be notified when verified.
                          </div>
                        )}

                        {req.status === 'certificate_issued' && (
                          <Link
                            href={`/learner/certifications/${req.id}`}
                            className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700"
                          >
                            <Award className="w-3.5 h-3.5" />
                            Download Your Certificate
                          </Link>
                        )}

                        {/* External body link for reference */}
                        {body?.website && !['certificate_issued', 'upload_pending', 'awaiting_upload'].includes(req.status) && (
                          <a
                            href={body.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-2"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {body.name}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
