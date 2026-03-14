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

  // Get regular enrollments (internal LMS courses)
  // Query training_enrollments directly and join courses for display
  const { data: regularEnrollments } = await db
    .from('training_enrollments')
    .select('*, course:training_courses(id, course_name, description, duration_hours, is_active)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Keep both sets separate for display, but combine for active enrollment check
  const allEnrollments = [
    ...(regularEnrollments || []),
    ...(partnerEnrollments || []),
  ];

  const activeEnrollment = allEnrollments.find(
    (e) => e.status === 'active' || e.status === 'pending' || e.status === 'pending_approval'
  );

  // Get course progress (use progress_percentage from enrollments if course_progress table doesn't exist)
  let courseProgress = 0;
  if (activeEnrollment) {
    // Try to get from course_progress table first
    const { data: progress, error: progressError } = await db
      .from('course_progress')
      .select('progress_percentage')
      .eq('enrollment_id', activeEnrollment.id)
      .single();

    if (!progressError && progress) {
      courseProgress = progress.progress_percentage || 0;
    } else {
      // Fallback to progress or progress_percentage column in enrollments
      courseProgress = activeEnrollment.progress_percentage || activeEnrollment.progress || 0;
    }
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
      <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
        <div className="relative h-[200px] sm:h-[280px] md:h-[340px]">
          <Image
            src={LMS_HEROES.dashboard}
            alt="Students celebrating training completion"
            fill
            sizes="100vw"
            className="object-cover"
            quality={100}
            priority
          />
        </div>
        <div className="bg-slate-900 py-8 px-8 md:px-12">
          <div className="flex items-center gap-3 mb-3">
            <GraduationCap className="w-10 h-10 text-white" />
            <h1 className="text-3xl md:text-4xl font-black text-white">
              Welcome Back, {profile?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
            </h1>
          </div>
          <p className="text-base md:text-lg text-white/90 mb-4">
            Start your next lesson, track progress, and complete quizzes and assessments.
          </p>

          {activeEnrollment && (
            <div className="bg-white/15 rounded-xl p-4 border border-white/20 max-w-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-white">Course Progress</span>
                <span className="font-black text-white">{Math.round(courseProgress)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div
                  className="bg-white rounded-full h-3 transition-all duration-500"
                  style={{ width: `${courseProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending Enrollment Notice */}
      {activeEnrollment && (activeEnrollment.status === 'pending_approval' || activeEnrollment.status === 'enrolled_pending_approval') && (
        <div className="mb-8 bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-amber-900 mb-2">Pending Admin Approval</h3>
              <p className="text-amber-800 mb-3">
                Your onboarding is complete and your enrollment is under review. An administrator will review your application and documents.
              </p>
              <p className="text-amber-700 text-sm mb-4">
                Once approved, you will receive an email confirming when you can start class. Your courses will be unlocked at that time.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-1.5 bg-brand-green-100 text-brand-green-800 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-brand-green-500" />
                  Onboarding Complete
                </div>
                <div className="flex items-center gap-1.5 bg-brand-green-100 text-brand-green-800 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-brand-green-500" />
                  Documents Submitted
                </div>
                <div className="flex items-center gap-1.5 bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Awaiting Approval
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  Course Access Locked
                </div>
              </div>
              <p className="text-amber-600 text-sm mt-4">
                Questions? Call <strong>(317) 314-3757</strong> or <a href="/support" className="underline hover:text-amber-800">get help online</a>.
              </p>
            </div>
          </div>
        </div>
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

        {/* My Programs — program-level enrollment cards */}
        {(programEnrollments?.length || 0) > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-black mb-4">My Programs</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {programEnrollments!.map((pe: any) => {
                const prog = pe.programs as { id: string; title: string; slug: string; code: string } | null;
                const progPercent = pe.progress_percent || 0;
                const isActive = pe.status === 'active' || pe.status === 'confirmed';
                return (
                  <Link
                    key={pe.id}
                    href={`/lms/program/${prog?.slug || prog?.code || prog?.id || pe.program_id}`}
                    className="bg-white rounded-xl border hover:border-brand-blue-300 hover:shadow-md transition p-6 group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 group-hover:text-brand-blue-600 transition">
                        {prog?.title || 'Program'}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isActive ? 'bg-brand-green-100 text-brand-green-700' :
                        pe.status === 'completed' ? 'bg-brand-blue-100 text-brand-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {isActive ? 'Active' : pe.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                      <div
                        className={`h-2 rounded-full transition-all ${progPercent === 100 ? 'bg-brand-green-500' : 'bg-brand-blue-500'}`}
                        style={{ width: `${progPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{progPercent}% complete</p>
                  </Link>
                );
              })}
            </div>
          </div>
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
                    href="/lms/orientation"
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
                    href="/lms/courses"
                    image={LMS_SECTION_CARDS.courses}
                    badge={courseProgress < 100 ? 'In Progress' : 'Complete'}
                  />
                )}

                {stateData.availableSections.includes('progress') && (
                  <SectionCard
                    title="Track Progress"
                    description="View your learning analytics"
                    href="/lms/progress"
                    image={LMS_SECTION_CARDS.progress}
                  />
                )}

                {stateData.availableSections.includes('certificates') && (
                  <SectionCard
                    title="My Certificates"
                    description="View and download your credentials"
                    href="/lms/certificates"
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
                    href="/lms/placement"
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
                    href="/lms/alumni"
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
            <WorkOneChecklistSection />

            {/* Progress Indicator */}
            <ProgressIndicator steps={progressSteps} />

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-black mb-4">
                Your Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-black">Programs Enrolled</span>
                  <span className="font-bold text-black">
                    {allEnrollments?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black">Certificates Earned</span>
                  <span className="font-bold text-black">
                    {certifications?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black">Overall Progress</span>
                  <span className="font-bold text-black">
                    {stateData.progressPercentage}%
                  </span>
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
