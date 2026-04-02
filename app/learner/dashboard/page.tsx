import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
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
  BarChart3,
  GraduationCap,
  Award,
  CheckCircle,
  Upload,
  ExternalLink,
  AlertCircle,
  FileCheck,
  Calendar,
  FileText,
  ScrollText,
} from 'lucide-react';
import { logger } from '@/lib/logger';

export const metadata: Metadata = {
  title: 'Learner Dashboard | Elevate LMS',
  description: 'Your learning dashboard - track progress, view courses, and manage your training.',
};

export const dynamic = 'force-dynamic';

export default async function LearnerDashboardPage() {
  // Require student role (admins can view for support)
  const { user, profile } = await requireRole(['student', 'admin', 'super_admin']);

  const supabase = await createClient();

  // Fetch enrollments from both tables (legacy enrollments + training_enrollments)
  const { data: legacyEnrollments } = await supabase
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

  const { data: trainingEnrollments } = await supabase
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

  // Fetch external (non-LMS) enrollments — rendered as admin-managed program cards
  const { data: externalEnrollments } = await supabase
    .from('external_program_enrollments')
    .select('id, program_slug, enrollment_state, start_date, notes, created_at')
    .eq('user_id', user.id)
    .eq('enrollment_state', 'active')
    .order('created_at', { ascending: false });

  // Fetch achievements
  const { data: achievements } = await supabase
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
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch certificates
  const { data: certificates } = await supabase
    .from('certificates')
    .select('id, certificate_number, course_title, issued_at, verification_code')
    .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
    .order('issued_at', { ascending: false })
    .limit(5);

  // Fetch active certification requests for the pipeline section
  const { data: certRequests } = await supabase
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
  const { data: attendanceData } = await supabase
    .from('attendance_hours')
    .select('hours_logged, date, type')
    .eq('enrollment_id', enrollments?.[0]?.id || '00000000-0000-0000-0000-000000000000')
    .order('date', { ascending: false })
    .limit(30);

  // Fetch training hours from consolidated hour_entries
  const { data: hoursData } = await supabase
    .from('hour_entries')
    .select('hours_claimed')
    .eq('user_id', user.id);

  const attendanceHours = attendanceData?.reduce((sum, a) => sum + (a.hours_logged || 0), 0) || 0;
  const trainingHours = hoursData?.reduce((sum, h) => sum + (Number(h.hours_claimed) || 0), 0) || 0;
  const totalHours = attendanceHours || trainingHours;

  // Fetch lesson progress for all enrolled courses
  const courseIds = enrollments?.map(e => e.course_id).filter(Boolean) || [];
  const { data: lessonProgress } = courseIds.length > 0
    ? await supabase
        .from('lesson_progress')
        .select('course_id, lesson_id, completed')
        .eq('user_id', user.id)
        .in('course_id', courseIds)
    : { data: null };

  // Check for pending onboarding (program_enrollments in pre-active state)
  const { data: pendingOnboarding } = await supabase
    .from('program_enrollments')
    .select('id, enrollment_state, next_required_action, full_name, program_id')
    .eq('user_id', user.id)
    .in('enrollment_state', ['applied', 'approved', 'confirmed', 'orientation_complete', 'documents_complete'])
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Auto-repair: if user has no active enrollment but has a paid Stripe session,
  // trigger reconciliation server-side. Fire-and-forget — never blocks render.
  const hasActiveEnrollment = (legacyEnrollments ?? []).some((e: any) => e.status === 'active');
  if (!hasActiveEnrollment) {
    const { data: paidApp } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['enrolled', 'ready_to_enroll', 'approved', 'in_review'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (paidApp) {
      const { data: stripeSession } = await supabase
        .from('stripe_sessions_staging')
        .select('session_id')
        .eq('application_id', paidApp.id)
        .eq('payment_status', 'paid')
        .limit(1)
        .maybeSingle();

      if (stripeSession) {
        // Paid session exists but no active enrollment — log only, do not block render
        logger.info('[dashboard] Paid session found but no active enrollment', { userId: user.id, appId: paidApp.id });
      }
    }
  }

  // Fetch recent messages (unread)
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('id, subject, body, created_at, sender_id, read')
    .eq('recipient_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(3);

  // Fetch upcoming schedule (cohort sessions, appointments)
  const now = new Date().toISOString();
  const { data: upcomingSchedule } = await supabase
    .from('cohort_sessions')
    .select('id, title, session_date, start_time, end_time, location, session_type')
    .gte('session_date', now.split('T')[0])
    .order('session_date', { ascending: true })
    .limit(3);

  // Check whether the learner has a pending_workone application — gates WorkOne checklist
  const { data: workoneApp } = await supabase
    .from('applications')
    .select('id, status, requested_funding_source')
    .eq('user_id', user.id)
    .eq('status', 'pending_workone')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const isPendingWorkone = !!workoneApp;

  // Calculate stats
  const activeEnrollments = enrollments?.filter(e => e.status === 'active') || [];
  const completedEnrollments = enrollments?.filter(e => e.status === 'completed') || [];
  const averageProgress = activeEnrollments.length > 0
    ? Math.round(activeEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / activeEnrollments.length)
    : 0;

  const userName = profile?.full_name || user.email?.split('@')[0] || 'Learner';

  // INTraining / ETPL official funded programs (2Exclusive LLC-S / Elevate for Humanity Training Center)
  const FUNDED_PROGRAMS = [
    { name: 'Barber Apprenticeship', id: '#10004637', duration: '15 months', cost: '$4,890', credentials: ['Registered Barber License', 'Rise Up Certificate'], href: '/programs/barber-apprenticeship' },
    { name: 'Beauty & Career Educator Training', id: '#10004648', duration: '84 days', cost: '$4,730', credentials: ['CPR', 'OSHA 10', 'Rise Up Certificate'], href: '/programs/beauty-educator' },
    { name: 'Bookkeeping, Accounting & Auditing Clerk', id: '#10004627', duration: '8 weeks', cost: '$4,925', credentials: ['QuickBooks Certified User', 'Microsoft Office Specialist'], href: '/programs/bookkeeping' },
    { name: 'Business Management', id: '#10004645', duration: '5 weeks', cost: '$4,900', credentials: ['Business of Retail Certified Specialist', 'Certified Business Professional'], href: '/programs/business-management' },
    { name: 'CPR, AED & First Aid', id: '#10004674', duration: '1 day', cost: '$575', credentials: ['CPR Certification'], href: '/programs/cpr-aed' },
    { name: 'Emergency Health & Safety Technician', id: '#10004621', duration: '4 weeks', cost: '$4,950', credentials: ['CPR', 'EMR', 'OSHA 10'], href: '/programs/emergency-health' },
    { name: 'Home Health Aide', id: '#10004626', duration: '4 weeks', cost: '$4,700', credentials: ['HHA License', 'CCHW', 'CPR', 'Rise Up Certificate'], href: '/programs/home-health-aide' },
    { name: 'HVAC Technician', id: '#10004322', duration: '20 weeks', cost: '$5,000', credentials: ['Residential HVAC Cert 1 & 2', 'EPA 608', 'OSHA 30', 'CPR', 'Rise Up Certificate'], href: '/programs/hvac-technician' },
    { name: 'Medical Assistant', id: '#10004639', duration: '21 days', cost: '$4,325', credentials: ['CCHW', 'CPR', 'Rise Up Certificate'], href: '/programs/medical-assistant' },
    { name: 'Professional Esthetician & Client Services', id: '#10004628', duration: '5 weeks', cost: '$4,575', credentials: ['OSHA 10', 'Business of Retail Certified Specialist'], href: '/programs/esthetician' },
    { name: 'Public Safety Reentry Specialist', id: '#10004666', duration: '45 days', cost: '$4,750', credentials: ['CPRC', 'CPSP', 'CCHW', 'CPR', 'Rise Up Certificate'], href: '/programs/reentry-specialist' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Elevate LMS
              </Link>
              <span className="text-slate-300">|</span>
              <span className="text-gray-500 text-sm">Learner Portal</span>
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
        {/* Welcome + How to use */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome back, {userName}
          </h1>
          {activeEnrollments.length > 0 ? (
            <p className="text-gray-500 text-sm mb-6">
              {activeEnrollments.length === 1
                ? `1 active program — ${averageProgress}% complete`
                : `${activeEnrollments.length} active programs — ${averageProgress}% average progress`}
            </p>
          ) : (
            <p className="text-gray-500 text-sm mb-6">No active programs yet — see available programs below.</p>
          )}

          {/* How to use your dashboard */}
          <div className="bg-brand-blue-50 border border-brand-blue-100 rounded-xl p-5">
            <h2 className="text-sm font-bold text-brand-blue-900 mb-3">How to use your dashboard</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { step: '1', title: 'My Programs', desc: 'Your active enrollments are listed below. Click Continue to pick up where you left off.' },
                { step: '2', title: 'Track Progress', desc: 'Your completion percentage updates automatically as you finish lessons and pass checkpoints.' },
                { step: '3', title: 'Earn Certificates', desc: 'Complete all lessons and pass every checkpoint to unlock your credential certificate.' },
                { step: '4', title: 'Get Help', desc: 'Use Quick Actions below to view attendance, contact your advisor, or find your certificates.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">{step}</span>
                  <div>
                    <p className="text-xs font-semibold text-brand-blue-900">{title}</p>
                    <p className="text-xs text-brand-blue-700 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                <h2 className="text-lg font-semibold text-gray-900">My Programs</h2>
                <p className="text-xs text-gray-400 mt-0.5">Programs you are currently enrolled in</p>
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
                              href={`/lms/courses/${enrollment.course_id}`}
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
                  <div className="p-10 text-center">
                    <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-gray-900 mb-1">No active programs yet</h3>
                    <p className="text-sm text-gray-400">Once you enroll, your programs will appear here. See the WIOA-Funded Programs section below to get started.</p>
                  </div>
                )}
              </div>

              {/* External (admin-managed) program enrollments */}
              {(externalEnrollments ?? []).length > 0 && (
                <div className="divide-y divide-gray-200 border-t border-gray-200">
                  {(externalEnrollments ?? []).map((ext: any) => (
                    <div key={ext.id} className="p-6">
                      <div className="flex gap-4 items-start">
                        <div className="w-16 h-16 bg-brand-blue-50 rounded-lg flex-shrink-0 flex items-center justify-center">
                          <GraduationCap className="w-7 h-7 text-brand-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 capitalize">
                              {ext.program_slug.replace(/-/g, ' ')}
                            </h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-blue-100 text-brand-blue-800">
                              Advisor Managed
                            </span>
                          </div>
                          {ext.start_date && (
                            <p className="text-xs text-gray-400 mb-3">
                              Start date: {new Date(ext.start_date).toLocaleDateString()}
                            </p>
                          )}
                          {ext.notes && (
                            <p className="text-sm text-gray-500 mb-3">{ext.notes}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Link
                              href={`/programs/${ext.program_slug}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-blue-700 transition"
                            >
                              <BookOpen className="w-3.5 h-3.5" /> View Program
                            </Link>
                            <Link
                              href="/support/contact"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Contact Advisor
                            </Link>
                            <Link
                              href="/lms/attendance"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition"
                            >
                              <Calendar className="w-3.5 h-3.5" /> Track Hours
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                  href="/lms/courses"
                  className="flex flex-col items-center p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition"
                >
                  <BookOpen className="w-8 h-8 text-brand-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700">My Courses</span>
                </Link>
                <Link
                  href="/lms/certificates"
                  className="flex flex-col items-center p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition"
                >
                  <Award className="w-8 h-8 text-emerald-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Certificates</span>
                </Link>
                <Link
                  href="/lms/attendance"
                  className="flex flex-col items-center p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition"
                >
                  <Calendar className="w-8 h-8 text-amber-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Attendance</span>
                </Link>
                <Link
                  href="/support/contact"
                  className="flex flex-col items-center p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition"
                >
                  <MessageSquare className="w-8 h-8 text-brand-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Get Help</span>
                </Link>
                <Link
                  href="/credentials"
                  className="flex flex-col items-center p-4 bg-white rounded-lg hover:bg-white transition"
                >
                  <FileText className="w-8 h-8 text-brand-orange-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Credentials</span>
                </Link>
                <Link
                  href="/transcript"
                  className="flex flex-col items-center p-4 bg-white rounded-lg hover:bg-white transition"
                >
                  <ScrollText className="w-8 h-8 text-slate-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Transcript</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* WorkOne Checklist — only shown for pending_workone applicants */}
            <WorkOneChecklistSection
              pendingWorkone={isPendingWorkone}
              fundingSource={workoneApp?.requested_funding_source ?? undefined}
            />

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
            <div className="bg-brand-blue-700 rounded-xl p-6 text-white">
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
                    <Link href="/lms/certificates" className="text-sm text-brand-orange-600 hover:text-brand-orange-700">
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
                              href={`/lms/certificates/${req.id}/upload`}
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
                            href={`/lms/certificates/${req.id}`}
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

        {/* Browse Programs — clearly separated from My Programs above */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Browse Available Programs</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                All programs are listed on Indiana&apos;s Eligible Training Provider List (ETPL) — most students pay $0 through WIOA or the Workforce Ready Grant.
              </p>
            </div>
            <a
              href="https://www.nextleveljobs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700 border border-brand-blue-200 rounded-lg px-3 py-2 bg-white"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Check Funding Eligibility
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FUNDED_PROGRAMS.map((prog) => (
              <div key={prog.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug">{prog.name}</h3>
                  <span className="flex-shrink-0 text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5">{prog.id}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{prog.duration}</span>
                  <span className="flex items-center gap-1"><FileCheck className="w-3 h-3" />{prog.cost} total</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {prog.credentials.map((c) => (
                    <span key={c} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5 font-medium">{c}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> WIOA / WRG Eligible
                  </span>
                  <Link
                    href={prog.href}
                    className="text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1"
                  >
                    Learn more <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Provider: 2Exclusive LLC-S · Elevate for Humanity Training Center · Indianapolis, Indiana (Marion County) ·{' '}
            <a href="https://www.nextleveljobs.org" target="_blank" rel="noopener noreferrer" className="underline">NextLevelJobs.org</a>
          </p>
        </div>

      </main>
    </div>
  );
}
