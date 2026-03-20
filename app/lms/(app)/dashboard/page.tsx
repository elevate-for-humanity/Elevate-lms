// @ts-nocheck
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { generateInternalMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateInternalMetadata({
  title: 'Student Dashboard',
  description: 'Your learning dashboard - track progress, courses, and achievements',
  path: '/lms/(app)/dashboard',
});

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeFormatDate } from '@/lib/format-utils';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import WorkOneChecklistSection from '@/components/workone/WorkOneChecklist';
import { getStudentState } from '@/lib/orchestration/state-machine';
import { LMS_HEROES, LMS_SECTION_CARDS, LMS_TOOLS } from '@/lib/lms/image-map';
import {
  StateAwareDashboard,
  SectionCard,
  ProgressIndicator,
} from '@/components/dashboards/StateAwareDashboard';
import {
  Book,
  Award,
  Briefcase,
  FileText,
  Users,
  HelpCircle,
  GraduationCap,
  TrendingUp,
  Target,
  ArrowRight,
} from 'lucide-react';
import { PointsDisplay } from '@/components/gamification/PointsDisplay';
import { BadgeShowcase } from '@/components/gamification/BadgeShowcase';
import { StreakTracker } from '@/components/gamification/StreakTracker';
import { ApprenticeProgressWidget } from '@/components/apprenticeship/ApprenticeProgressWidget';
import { MiladyAccessCard } from '@/components/apprenticeship/MiladyAccessCard';
import { TutorialLibrary } from '@/components/TutorialSystem';
import PeerTutoringMarketplace from '@/components/PeerTutoringMarketplace';
import { NotificationBell } from '@/components/lms/NotificationBell';
import { GlobalSearch } from '@/components/lms/GlobalSearch';
import { CertificationTracker } from '@/components/lms/CertificationTracker';
import { RequirementsChecklist } from '@/components/lms/RequirementsChecklist';
import { RecommendedCourses } from '@/components/lms/RecommendedCourses';
import { DashboardHero } from '@/components/lms/dashboard/DashboardHero';
import { EnrolledProgramsList } from '@/components/lms/dashboard/EnrolledProgramsList';
import { EmptyEnrollmentState } from '@/components/lms/dashboard/EmptyEnrollmentState';
import { StudentToolsStrip } from '@/components/lms/dashboard/StudentToolsStrip';
import { PendingApprovalNotice } from '@/components/lms/dashboard/PendingApprovalNotice';

/**
 * STUDENT PORTAL - ORCHESTRATED
 *
 * This is the nervous system. Not a skeleton.
 *
 * Rules:
 * - State determines everything
 * - One dominant action per state
 * - Locked sections until prerequisites met
 * - Cannot mess up - system carries you
 */

export default async function StudentDashboardOrchestrated() {
  // Require student role
  const { user, profile } = await requireRole([
    'student',
    'admin',
    'super_admin',
  ]);

  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  // Get program-level enrollments (multi-program architecture)
  const { data: programEnrollments } = await db
    .from('program_enrollments')
    .select('id, status, enrolled_at, progress_percent, program_id, programs(id, title, slug, code)')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false });

  // Get partner enrollments (external providers like HSI)
  const { data: partnerEnrollments } = await db
    .from('partner_lms_enrollments')
    .select('*, partner_lms_courses(*), partner_lms_providers(*)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false });

  // Get canonical course enrollments (program_enrollments with course_id set)
  const { data: courseEnrollments } = await db
    .from('program_enrollments')
    .select('id, status, enrolled_at, progress_percent, course_id, courses(id, title, description)')
    .eq('user_id', user.id)
    .not('course_id', 'is', null)
    .order('enrolled_at', { ascending: false });

  // Combine only for active enrollment check — display stays separated
  const allEnrollments = [
    ...(courseEnrollments || []),
    ...(partnerEnrollments || []),
  ];

  const activeEnrollment = allEnrollments.find(
    (e) => e.status === 'active' || e.status === 'pending' || e.status === 'pending_approval'
  );

  // Separate counts for stats display
  const internalEnrollmentCount = (programEnrollments?.length || 0) + (regularEnrollments?.length || 0);
  const partnerEnrollmentCount  = partnerEnrollments?.length || 0;

  // Active partner enrollments (not completed)
  const activePartnerEnrollments = (partnerEnrollments || []).filter(
    (e) => e.status !== 'completed' && e.status !== 'cancelled'
  );
  // Completed partner enrollments = credentials earned
  const completedPartnerEnrollments = (partnerEnrollments || []).filter(
    (e) => e.status === 'completed'
  );

  // Get course progress (use progress_percentage from enrollments if course_progress table doesn't exist)
  let courseProgress = 0;
  if (activeEnrollment) {
    // Use progress_percent from program_enrollments (canonical)
    courseProgress = activeEnrollment.progress_percent ?? activeEnrollment.progress_percentage ?? 0;
  }

  // Get certifications from certificates table
  const { data: certifications } = await db
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
    .then((res) => res)
    .catch(() => ({ data: null, error: null }));

  // Get job placements (gracefully handle if table doesn't exist)
  const { data: placements } = await db
    .from('job_placements')
    .select('*')
    .eq('user_id', user.id)
    .then((res) => res)
    .catch(() => ({ data: null, error: null }));

  // Check whether the learner has a pending_workone application — gates WorkOne checklist
  const { data: workoneApp } = await db
    .from('applications')
    .select('id, status, requested_funding_source')
    .eq('user_id', user.id)
    .eq('status', 'pending_workone')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const isPendingWorkone = !!workoneApp;

  // Calculate state
  const stateData = getStudentState({
    hasCompletedOrientation: profile.orientation_completed || false,
    isEligibilityVerified: profile.eligibility_verified || false,
    hasActiveEnrollment: !!activeEnrollment,
    enrollmentStatus: activeEnrollment?.status,
    courseProgress,
    hasCertification: (certifications?.length || 0) > 0,
    hasJobPlacement: (placements?.length || 0) > 0,
  });

  // Build progress steps
  const progressSteps = [
    {
      label: 'Complete Orientation',
      status: profile.orientation_completed
        ? ('completed' as const)
        : ('current' as const),
    },
    {
      label: 'Verify Eligibility',
      status: !profile.orientation_completed
        ? ('locked' as const)
        : profile.eligibility_verified
          ? ('completed' as const)
          : ('current' as const),
    },
    {
      label: 'Enroll in Program',
      status: !profile.eligibility_verified
        ? ('locked' as const)
        : activeEnrollment
          ? ('completed' as const)
          : ('current' as const),
    },
    {
      label: 'Complete Coursework',
      status: !activeEnrollment
        ? ('locked' as const)
        : activeEnrollment.status === 'completed'
          ? ('completed' as const)
          : ('current' as const),
    },
    {
      label: 'Earn Certification',
      status:
        activeEnrollment?.status !== 'completed'
          ? ('locked' as const)
          : (certifications?.length || 0) > 0
            ? ('completed' as const)
            : ('current' as const),
    },
    {
      label: 'Find Employment',
      status:
        (certifications?.length || 0) === 0
          ? ('locked' as const)
          : (placements?.length || 0) > 0
            ? ('completed' as const)
            : ('current' as const),
    },
  ];

  return (
    <>
      {/* Top Bar: Breadcrumbs + Search + Notifications */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <Breadcrumbs items={[{ label: 'LMS', href: '/lms' }, { label: 'Dashboard' }]} />
        <div className="flex items-center gap-3">
          <GlobalSearch />
          <NotificationBell />
        </div>
      </div>

      {/* Hero Welcome Banner */}
      <DashboardHero
        firstName={profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Student'}
        courseProgress={courseProgress}
        hasActiveEnrollment={!!activeEnrollment}
      />

      {/* Pending Enrollment Notice */}
      {activeEnrollment && (activeEnrollment.status === 'pending_approval' || activeEnrollment.status === 'enrolled_pending_approval') && (
        <PendingApprovalNotice />
      )}

      <StateAwareDashboard
        dominantAction={stateData.dominantAction}
        availableSections={stateData.availableSections}
        lockedSections={stateData.lockedSections}
        progressPercentage={stateData.progressPercentage}
        alerts={stateData.alerts}
      >
        {/* Gamification Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <PointsDisplay userId={user.id} />
          <StreakTracker userId={user.id} />
          <BadgeShowcase userId={user.id} limit={3} />
        </div>


        {/* ── MY PROGRAMS (internal LMS) ─────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">My Programs</h2>
            <Link href="/lms/courses" className="text-sm text-brand-blue-600 hover:underline font-medium">
              View all →
            </Link>
          </div>
          {(programEnrollments?.length || 0) > 0 ? (
            <EnrolledProgramsList enrollments={programEnrollments} />
          ) : (
            <EmptyEnrollmentState />
          )}
        </section>

        {/* ── PARTNER TRAINING ──────────────────────────────────── */}
        {activePartnerEnrollments.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Partner Training</h2>
              <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full">
                External providers
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activePartnerEnrollments.map((enrollment: any) => {
                const course   = enrollment.partner_lms_courses;
                const provider = enrollment.partner_lms_providers;
                const pct      = enrollment.progress_percentage ?? 0;
                return (
                  <div key={enrollment.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm leading-snug">
                          {course?.course_name ?? 'Partner Course'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {provider?.provider_name ?? 'External Provider'}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        enrollment.status === 'completed'
                          ? 'bg-brand-green-100 text-brand-green-700'
                          : enrollment.status === 'active'
                          ? 'bg-brand-blue-100 text-brand-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {enrollment.status}
                      </span>
                    </div>
                    {pct > 0 && (
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Progress</span>
                          <span className="font-medium">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                    {enrollment.metadata?.access_url && (
                      <a
                        href={enrollment.metadata.access_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto text-center text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-800 border border-brand-blue-200 rounded-lg py-2 transition-colors"
                      >
                        Continue on {provider?.provider_name ?? 'Partner Site'} →
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── MY CERTIFICATIONS (completed partner + program certs) ── */}
        {((certifications?.length || 0) > 0 || completedPartnerEnrollments.length > 0) && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">My Certifications</h2>
              <Link href="/lms/certificates" className="text-sm text-brand-blue-600 hover:underline font-medium">
                View all →
              </Link>
            </div>
            <div className="flex flex-wrap gap-3">
              {/* Program completion certificates */}
              {(certifications || []).map((cert: any) => (
                <div key={cert.id} className="bg-white border border-brand-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <Award className="w-5 h-5 text-brand-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{cert.title ?? cert.certificate_type ?? 'Certificate'}</p>
                    <p className="text-xs text-slate-500">{cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'Issued'}</p>
                  </div>
                </div>
              ))}
              {/* Completed partner course credentials */}
              {completedPartnerEnrollments.map((enrollment: any) => {
                const course = enrollment.partner_lms_courses;
                return (
                  <div key={enrollment.id} className="bg-white border border-brand-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
                    <Award className="w-5 h-5 text-brand-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{course?.course_name ?? 'Partner Certification'}</p>
                      <p className="text-xs text-slate-500">
                        {enrollment.partner_lms_providers?.provider_name ?? 'Partner'} ·{' '}
                        {enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString() : 'Completed'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Certification Progress & Requirements */}
        {activeEnrollment && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <CertificationTracker
              programId={activeEnrollment.program_id || activeEnrollment.partner_lms_course_id || ''}
              userId={user.id}
            />
            <RequirementsChecklist
              requirements={[]}
              enrollmentId={activeEnrollment.id}
            />
          </div>
        )}

        {/* Recommended Courses */}
        <div className="mb-8">
          <RecommendedCourses />
        </div>

        {/* Beauty Apprenticeship Widgets - Show for beauty industry programs */}
        {activeEnrollment && (
          ['barber-apprenticeship', 'cosmetology-apprenticeship', 'esthetician-apprenticeship', 'nail-technician-apprenticeship'].includes(
            activeEnrollment.programs?.slug || activeEnrollment.partner_lms_courses?.slug || ''
          )
        ) && (
          <div className="mb-8 space-y-6">
            {/* Milady Access Card - Prominent access to theory training */}
            <MiladyAccessCard
              studentId={user.id}
              programSlug={activeEnrollment.programs?.slug || activeEnrollment.partner_lms_courses?.slug || 'barber-apprenticeship'}
              miladyEnrolled={activeEnrollment.milady_enrolled}
              miladyCompleted={activeEnrollment.milady_completed}
            />
            
            {/* Apprentice Progress Widget */}
            <ApprenticeProgressWidget 
              enrollmentId={activeEnrollment.id}
              studentId={user.id}
              programName={activeEnrollment.programs?.name || activeEnrollment.partner_lms_courses?.name || 'Beauty Apprenticeship'}
            />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Available Sections */}
            <div>
              <h3 className="text-2xl font-bold text-black mb-6">
                Available Now
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {stateData.availableSections.includes('orientation') && (
                  <SectionCard
                    title="Orientation"
                    description="Get started with your training journey"
                    href="/learner/orientation"
                    image={LMS_SECTION_CARDS.orientation}
                    badge={
                      !profile.orientation_completed ? 'Required' : undefined
                    }
                  />
                )}

                {stateData.availableSections.includes('eligibility') && (
                  <SectionCard
                    title="Eligibility Check"
                    description="Verify you qualify for free training"
                    href="/start"
                    image={LMS_SECTION_CARDS.eligibility}
                    badge={
                      !profile.eligibility_verified ? 'Required' : undefined
                    }
                  />
                )}

                {stateData.availableSections.includes('programs') && (
                  <SectionCard
                    title="Browse Programs"
                    description="Explore 20+ training programs"
                    href="/programs"
                    image={LMS_SECTION_CARDS.programs}
                  />
                )}

                {stateData.availableSections.includes('programs-view') && (
                  <SectionCard
                    title="View Programs"
                    description="See what's available (enroll after eligibility)"
                    href="/programs"
                    image={LMS_SECTION_CARDS.programsView}
                  />
                )}

                {stateData.availableSections.includes('funding') && (
                  <SectionCard
                    title="Funding Options"
                    description="Learn about WIOA, WRG, and other funding"
                    href="/how-it-works#funding"
                    image={LMS_SECTION_CARDS.funding}
                  />
                )}

                {stateData.availableSections.includes('courses') && (
                  <SectionCard
                    title="My Courses"
                    description={activeEnrollment?.status === 'pending_approval' ? 'Awaiting admin approval to begin' : `Continue learning (${courseProgress}% complete)`}
                    href="/learner/courses"
                    image={LMS_SECTION_CARDS.courses}
                    badge={courseProgress < 100 ? 'In Progress' : 'Complete'}
                  />
                )}

                {stateData.availableSections.includes('progress') && (
                  <SectionCard
                    title="Track Progress"
                    description="View your learning analytics"
                    href="/learner/progress"
                    image={LMS_SECTION_CARDS.progress}
                  />
                )}

                {stateData.availableSections.includes('certificates') && (
                  <SectionCard
                    title="My Certificates"
                    description="View and download your credentials"
                    href="/learner/certificates"
                    image={LMS_SECTION_CARDS.certificates}
                  />
                )}

                {stateData.availableSections.includes('certification') && (
                  <SectionCard
                    title="Certification Exam"
                    description="Schedule your final exam"
                    href="/lms/certification"
                    image={LMS_SECTION_CARDS.certification}
                    badge="Ready"
                  />
                )}

                {stateData.availableSections.includes('placement') && (
                  <SectionCard
                    title="Job Placement"
                    description="Connect with employers"
                    href="/learner/placement"
                    image={LMS_SECTION_CARDS.placement}
                  />
                )}

                {stateData.availableSections.includes('support') && (
                  <SectionCard
                    title="Get Support"
                    description="Contact your advisor"
                    href="/lms/support"
                    image={LMS_SECTION_CARDS.support}
                  />
                )}

                {stateData.availableSections.includes('alumni') && (
                  <SectionCard
                    title="Alumni Network"
                    description="Connect with graduates"
                    href="/learner/alumni"
                    image={LMS_SECTION_CARDS.alumni}
                  />
                )}
              </div>
            </div>

            {/* Current Enrollment Info */}
            {activeEnrollment && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-xl font-bold text-black mb-4">
                  Current Program
                </h3>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-black mb-2">
                      {activeEnrollment.programs?.name || 'Program'}
                    </h4>
                    <div className="space-y-2 text-sm text-black">
                      <div>
                        <span className="font-semibold">Status:</span>{' '}
                        <span className="capitalize">
                          {activeEnrollment.status}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold">Progress:</span>{' '}
                        {courseProgress}%
                      </div>
                      <div>
                        <span className="font-semibold">Enrolled:</span>{' '}
                        {safeFormatDate(activeEnrollment?.created_at || activeEnrollment?.enrolled_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* WorkOne Visit Checklist */}
            <WorkOneChecklistSection
              pendingWorkone={isPendingWorkone}
              fundingSource={workoneApp?.requested_funding_source ?? undefined}
            />

            {/* Progress Indicator */}
            <ProgressIndicator steps={progressSteps} />

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Your Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 text-sm">Programs</span>
                  <span className="font-bold text-slate-900">{internalEnrollmentCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 text-sm">Partner Courses</span>
                  <span className="font-bold text-slate-900">{partnerEnrollmentCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 text-sm">Certifications</span>
                  <span className="font-bold text-slate-900">
                    {(certifications?.length || 0) + completedPartnerEnrollments.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 text-sm">Overall Progress</span>
                  <span className="font-bold text-slate-900">{stateData.progressPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Support Card */}
            <div className="bg-brand-blue-50 rounded-lg border-2 border-brand-blue-600 p-6">
              <h3 className="text-lg font-bold text-brand-blue-900 mb-3">
                Need Help?
              </h3>
              <p className="text-brand-blue-800 mb-4 text-sm">
                Your advisor is here to support you every step of the way.
              </p>
              <a
                href="/support"
                className="block w-full text-center px-4 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition"
              >
                Call (317) 314-3757
              </a>
            </div>

            {/* All Student Features — descriptive cards with images */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                My Learning Tools
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { href: '/lms/courses', label: 'My Courses', desc: 'Continue lessons, watch videos, and complete modules', image: LMS_TOOLS.courses },
                  { href: '/lms/assignments', label: 'Assignments', desc: 'View due dates, submit work, and check feedback', image: LMS_TOOLS.assignments },
                  { href: '/lms/grades', label: 'Grades', desc: 'See scores, GPA, and instructor comments', image: LMS_TOOLS.grades },
                  { href: '/lms/quizzes', label: 'Quizzes & Exams', desc: 'Take practice quizzes and certification exams', image: LMS_TOOLS.quizzes },
                  { href: '/lms/schedule', label: 'Schedule', desc: 'Class times, deadlines, and upcoming events', image: LMS_TOOLS.schedule },
                  { href: '/lms/messages', label: 'Messages', desc: 'Chat with instructors and classmates', image: LMS_TOOLS.messages },
                  { href: '/lms/resources', label: 'Resources', desc: 'Handouts, study guides, and reference materials', image: LMS_TOOLS.resources },
                  { href: '/lms/certificates', label: 'Certificates', desc: 'Download earned credentials and certificates', image: LMS_TOOLS.certificates },
                  { href: '/lms/achievements', label: 'Achievements', desc: 'Badges, streaks, and milestones you have earned', image: LMS_TOOLS.achievements },
                  { href: '/lms/profile', label: 'My Profile', desc: 'Update your info, photo, and contact details', image: LMS_TOOLS.profile },
                  { href: '/lms/support', label: 'Get Help', desc: 'Contact your advisor or submit a support request', image: LMS_TOOLS.support },
                  { href: '/lms/forums', label: 'Discussion Forums', desc: 'Ask questions and share knowledge with peers', image: LMS_TOOLS.forums },
                ].map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    aria-label={tool.label}
                    className="group flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-xl hover:border-brand-blue-400 hover:shadow-md transition-all"
                  >
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={tool.image}
                        alt={tool.label}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 group-hover:text-brand-blue-600 transition text-sm">{tool.label}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{tool.desc}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-blue-600 flex-shrink-0 transition" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Tutorial System */}
            <div className="mt-6">
              <TutorialLibrary userId={user.id} userRole="student" />
            </div>

            {/* Peer Tutoring */}
            <div className="mt-6">
              <PeerTutoringMarketplace />
            </div>
          </div>
        </div>
      </StateAwareDashboard>
    </>
  );
}
