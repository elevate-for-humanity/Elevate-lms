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
import { safeFormatDate } from '@/lib/format-utils';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getStudentState } from '@/lib/orchestration/state-machine';
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
} from 'lucide-react';
import { PointsDisplay } from '@/components/gamification/PointsDisplay';
import { BadgeShowcase } from '@/components/gamification/BadgeShowcase';
import { StreakTracker } from '@/components/gamification/StreakTracker';
import { ApprenticeProgressWidget } from '@/components/apprenticeship/ApprenticeProgressWidget';
import { MiladyAccessCard } from '@/components/apprenticeship/MiladyAccessCard';
import { TutorialSystem } from '@/components/TutorialSystem';
import PeerTutoringMarketplace from '@/components/PeerTutoringMarketplace';

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

  // Get partner enrollments (external providers like HSI)
  const { data: partnerEnrollments } = await supabase
    .from('partner_lms_enrollments')
    .select('*, partner_lms_courses(*), partner_lms_providers(*)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false });

  // Get regular enrollments (internal LMS courses)
  const { data: regularEnrollments } = await supabase
    .from('enrollments')
    .select('*, programs(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Keep both sets separate for display, but combine for active enrollment check
  const allEnrollments = [
    ...(regularEnrollments || []),
    ...(partnerEnrollments || []),
  ];

  const activeEnrollment = allEnrollments.find(
    (e) => e.status === 'active' || e.status === 'pending'
  );

  // Get course progress (use progress_percentage from enrollments if course_progress table doesn't exist)
  let courseProgress = 0;
  if (activeEnrollment) {
    // Try to get from course_progress table first
    const { data: progress, error: progressError } = await supabase
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

  // Get certifications (gracefully handle if table doesn't exist)
  const { data: certifications } = await supabase
    .from('certifications')
    .select('*')
    .eq('user_id', user.id)
    .then((res) => res)
    .catch(() => ({ data: null, error: null }));

  // Get job placements (gracefully handle if table doesn't exist)
  const { data: placements } = await supabase
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
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs items={[{ label: 'LMS', href: '/lms' }, { label: 'Dashboard' }]} />
      </div>

      {/* Hero Welcome Banner */}
      <div className="relative text-white mb-8 rounded-2xl overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/heroes/hero-homepage.jpg"
            alt="Learning"
            fill
            className="object-cover"
            quality={100}
          />
        </div>
        <div className="relative z-10 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="w-10 h-10" />
            <div>
              <h1 className="text-3xl md:text-4xl font-black">
                Welcome to Your Student Portal
              </h1>
              <p className="text-lg text-green-100">
                {profile?.full_name || user.email?.split('@')[0]}, you're in. Start your first lesson, track progress, upload required items, see deadlines and announcements, and complete quizzes and assessments.
              </p>
            </div>
          </div>

          {activeEnrollment && (
            <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Current Program Progress</span>
                <span className="font-black">
                  {Math.round(courseProgress)}%
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div
                  className="bg-white rounded-full h-3 transition-all duration-500"
                  style={{ width: `${courseProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending Enrollment Notice - Show when enrolled but not yet active */}
      {activeEnrollment && activeEnrollment.status === 'enrolled_pending_approval' && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-amber-900 mb-2">Enrollment Pending Approval</h3>
          <p className="text-amber-800 mb-4">
            Your enrollment is confirmed. Training access unlocks after approval and shop assignment.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">✓</span>
              <span className="text-amber-900">Applied</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">✓</span>
              <span className="text-amber-900">Payment Received</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs">⏳</span>
              <span className="text-amber-700">Shop Assignment</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-300 text-white flex items-center justify-center text-xs">🔒</span>
              <span className="text-slate-500">Training Access</span>
            </div>
          </div>
          <p className="text-amber-700 text-sm mt-4">
            Questions? Call <a href="/support" className="underline">Get Help Online</a>
          </p>
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
                    image="/hero-images/how-it-works-hero.jpg"
                    badge={
                      !profile.orientation_completed ? 'Required' : undefined
                    }
                  />
                )}

                {stateData.availableSections.includes('eligibility') && (
                  <SectionCard
                    title="Eligibility Check"
                    description="Verify you qualify for free training"
                    href="/apply"
                    image="/hero-images/apply-hero.jpg"
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
                    image="/hero-images/programs-hero.jpg"
                  />
                )}

                {stateData.availableSections.includes('programs-view') && (
                  <SectionCard
                    title="View Programs"
                    description="See what's available (enroll after eligibility)"
                    href="/programs"
                    image="/hero-images/programs-hero.jpg"
                  />
                )}

                {stateData.availableSections.includes('funding') && (
                  <SectionCard
                    title="Funding Options"
                    description="Learn about WIOA, WRG, and other funding"
                    href="/how-it-works#funding"
                    image="/hero-images/wioa-hero.jpg"
                  />
                )}

                {stateData.availableSections.includes('courses') && (
                  <SectionCard
                    title="My Courses"
                    description={`Continue learning (${courseProgress}% complete)`}
                    href="/lms/courses"
                    image="/hero-images/healthcare-category.jpg"
                    badge={courseProgress < 100 ? 'In Progress' : 'Complete'}
                  />
                )}

                {stateData.availableSections.includes('progress') && (
                  <SectionCard
                    title="Track Progress"
                    description="View your learning analytics"
                    href="/lms/progress"
                    image="/hero-images/skilled-trades-category.jpg"
                  />
                )}

                {stateData.availableSections.includes('certificates') && (
                  <SectionCard
                    title="My Certificates"
                    description="View and download your credentials"
                    href="/lms/certificates"
                    image="/hero-images/technology-category.jpg"
                  />
                )}

                {stateData.availableSections.includes('certification') && (
                  <SectionCard
                    title="Certification Exam"
                    description="Schedule your final exam"
                    href="/lms/certification"
                    image="/images/business/professional-1.jpg"
                    badge="Ready"
                  />
                )}

                {stateData.availableSections.includes('placement') && (
                  <SectionCard
                    title="Job Placement"
                    description="Connect with employers"
                    href="/lms/placement"
                    image="/images/heroes/lms-profile.jpg"
                  />
                )}

                {stateData.availableSections.includes('support') && (
                  <SectionCard
                    title="Get Support"
                    description="Contact your advisor"
                    href="/lms/support"
                    image="/hero-images/barber-beauty-category.jpg"
                  />
                )}

                {stateData.availableSections.includes('alumni') && (
                  <SectionCard
                    title="Alumni Network"
                    description="Connect with graduates"
                    href="/lms/alumni"
                    image="/hero-images/about-hero.jpg"
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
                    {enrollments?.length || 0}
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
                Call Get Help Online
              </a>
            </div>

            {/* All Student Features */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-black mb-4">
                My Learning Tools
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Link
                  href="/lms/courses"
                  aria-label="Link"
                  className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
                >
                  My Courses
                </Link>
                <Link
                  href="/lms/assignments"
                  aria-label="Link"
                  className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
                >
                  Assignments
                </Link>
                <Link
                  href="/lms/grades"
                  aria-label="Link"
                  className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
                >
                  Grades
                </Link>
                <Link
                  href="/lms/calendar"
                  aria-label="Link"
                  className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
                >
                  Calendar
                </Link>
                <Link
                  href="/lms/messages"
                  aria-label="Link"
                  className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
                >
                  Messages
                </Link>
                <Link
                  href="/lms/forums"
                  aria-label="Link"
                  className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
                >
                  Forums
                </Link>
                <Link
                  href="/lms/study-groups"
                  aria-label="Link"
                  className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
                >
                  Study Groups
                </Link>
                <Link
                  href="/lms/resources"
                  aria-label="Link"
                  className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
                >
                  Resources
                </Link>
                <Link
                  href="/lms/certificates"
                  aria-label="Link"
                  className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
                >
                  Certificates
                </Link>
                <Link
                  href="/lms/achievements"
                  aria-label="Link"
                  className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
                >
                  Achievements
                </Link>
                <Link
                  href="/lms/profile"
                  aria-label="Link"
                  className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
                >
                  My Profile
                </Link>
                <Link
                  href="/lms/support"
                  aria-label="Link"
                  className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
                >
                  Support
                </Link>
              </div>
            </div>

            {/* Tutorial System */}
            <div className="mt-6">
              <TutorialSystem userId={user.id} userRole="student" />
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
