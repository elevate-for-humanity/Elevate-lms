import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  AlertCircle,
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  CreditCard,
  FileText,
  FolderOpen,
  MapPin,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { courseOverviewPath } from '@/lib/lms/routes';
import { getProgramHeroImage } from '@/lib/images/programImages';
import { resolveApprenticeshipRuntimeContext } from '@/lib/apprenticeship/runtime-context';
import { loadRegisteredApprenticeshipProgress } from '@/lib/apprenticeship/progress-service';
import { resolveApplicableWage } from '@/lib/apprenticeship/registered-program-contract';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { getBeautyApprenticeshipConfig } from '@/lib/apprenticeship/beauty-program-config';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';

export const metadata: Metadata = {
  title: 'Apprentice Dashboard',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

type PriorLearningModule = { title: string; percent: number };
type PriorLearningImport = {
  overall_percent: number;
  imported_at?: string;
  status?: 'verified_source' | 'pending_review' | 'approved';
  modules?: PriorLearningModule[];
};

function readPriorLearningImport(draftData: unknown): PriorLearningImport | null {
  if (!draftData || typeof draftData !== 'object') return null;
  const value = (draftData as Record<string, unknown>).legacy_learning_progress;
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const overallPercent = Number(record.overall_percent);
  if (!Number.isFinite(overallPercent)) return null;
  const modules = Array.isArray(record.modules)
    ? record.modules
        .filter((item): item is Record<string, unknown> =>
          Boolean(item && typeof item === 'object'),
        )
        .map((item) => ({
          title: String(item.title || 'Prior learning'),
          percent: Math.min(100, Math.max(0, Number(item.percent) || 0)),
        }))
    : [];
  return {
    overall_percent: Math.min(100, Math.max(0, overallPercent)),
    imported_at: typeof record.imported_at === 'string' ? record.imported_at : undefined,
    status:
      record.status === 'approved' ||
      record.status === 'pending_review' ||
      record.status === 'verified_source'
        ? record.status
        : 'pending_review',
    modules,
  };
}

export default async function ApprenticePortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const db = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(db, user?.id);
  if (!subject.userId) redirect('/login?redirect=/apprentice');
  const { data: subjectProfile } = await db
    .from('profiles')
    .select('role')
    .eq('id', subject.userId)
    .maybeSingle();
  const isNeutralAdminPreview =
    !subject.previewing && ['admin', 'super_admin'].includes(String(subjectProfile?.role || ''));
  if (isNeutralAdminPreview) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 pb-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-red-700">
            Administrator portal preview
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Apprentice PWA</h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-700">
            This neutral preview confirms that the Apprentice PWA is available without attaching an
            administrator to a learner record. Select a learner from secured Admin student
            management to open an audited, read-only dashboard.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://admin.elevateforhumanity.org/students"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
            >
              Select a learner in Admin
            </a>
            <a
              href="https://admin.elevateforhumanity.org/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950"
            >
              Return to Admin dashboard
            </a>
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            'Orientation',
            'Work Hours',
            'Timeclock',
            'Competencies',
            'Documents',
            'Billing & Payments',
            'RTI',
            'Handbook',
            'State Board',
          ].map((label) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <ShieldCheck className="h-5 w-5 text-brand-red-700" />
              <h2 className="mt-3 font-black text-slate-950">{label}</h2>
              <p className="mt-1 text-sm text-slate-600">
                Available after an authorized learner is selected.
              </p>
            </article>
          ))}
        </section>
      </main>
    );
  }
  const programSlug = await resolveApprenticeProgramSlug(db, subject.userId);
  if (!programSlug) redirect('/lms/dashboard?notice=apprentice-access-required');

  const runtime = await resolveApprenticeshipRuntimeContext(db, {
    userId: subject.userId,
    programSlug,
    requireRegisteredStandard: false,
  });
  if (!runtime) redirect('/lms/dashboard?notice=apprentice-enrollment-required');
  const beautyProgram = getBeautyApprenticeshipConfig(programSlug);
  const registeredStandard = getRegisteredProgramStandard(programSlug);

  const [
    { data: profile },
    { data: docs },
    certsRes,
    { data: documentRequirements },
    { data: handbookAcceptance },
    { data: cosmetologyBilling },
    { data: theorySchedule },
  ] = await Promise.all([
    db
      .from('profiles')
      .select('full_name,first_name,last_name')
      .eq('id', subject.userId)
      .maybeSingle(),
    db
      .from('documents')
      .select('id,document_type,status,verification_status')
      .eq('user_id', subject.userId),
    db
      .from('program_completion_certificates')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', subject.userId),
    db
      .from('apprentice_document_types')
      .select('document_type,is_required')
      .eq('program_slug', programSlug)
      .eq('is_required', true),
    db
      .from('license_agreement_acceptances')
      .select('id')
      .eq('user_id', subject.userId)
      .eq('agreement_type', 'handbook')
      .limit(1)
      .maybeSingle(),
    programSlug === 'cosmetology-apprenticeship'
      ? db
          .from('cosmetology_subscriptions')
          .select('stripe_subscription_id,payment_status,setup_fee_paid,fully_paid')
          .eq('user_id', subject.userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    (db as any)
      .from('apprenticeship_theory_schedules')
      .select(
        'id,course_id,timezone,days_of_week,start_time,end_time,weekly_target_minutes,weekly_max_minutes,active',
      )
      .eq('user_id', subject.userId)
      .eq('program_slug', programSlug)
      .eq('active', true)
      .limit(1)
      .maybeSingle(),
  ]);

  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || 'Apprentice';
  const displayProgram =
    runtime.contract?.standard.occupationTitle ||
    programSlug.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const heroImage = getProgramHeroImage(programSlug);
  const verifiedDocs = (docs || []).filter((doc) =>
    ['approved', 'verified'].includes(
      String(doc.verification_status || doc.status || '').toLowerCase(),
    ),
  ).length;
  const totalDocs = docs?.length ?? 0;
  const approvedDocumentTypes = new Set(
    (docs || [])
      .filter((doc: any) =>
        ['approved', 'verified', 'accepted'].includes(
          String(doc.verification_status || doc.status || '').toLowerCase(),
        ),
      )
      .map((doc: any) => doc.document_type),
  );
  const missingDocumentCount = (documentRequirements || []).filter(
    (item: any) => !approvedDocumentTypes.has(item.document_type),
  ).length;

  let courseTitle = 'Assigned RTI course';
  let courseHref = '/lms/courses';
  let totalLessons = 0;
  let completedLessons = 0;
  if (runtime.enrollment.course_id) {
    const [courseRes, lessonCountRes, progressCountRes] = await Promise.all([
      db.from('courses').select('title,slug').eq('id', runtime.enrollment.course_id).maybeSingle(),
      db
        .from('course_lessons')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', runtime.enrollment.course_id)
        .eq('is_published', true),
      db
        .from('lesson_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', subject.userId)
        .eq('course_id', runtime.enrollment.course_id)
        .eq('completed', true),
    ]);
    courseTitle = courseRes.data?.title || courseTitle;
    courseHref = courseOverviewPath(runtime.enrollment.course_id);
    totalLessons = lessonCountRes.count ?? 0;
    completedLessons = progressCountRes.count ?? 0;
  }
  const digitalCoursePercent = totalLessons
    ? Math.min(100, Math.round((completedLessons / totalLessons) * 100))
    : 0;
  const priorLearning = readPriorLearningImport(runtime.enrollment.draft_data);
  const learningJourneyPercent = Math.max(
    digitalCoursePercent,
    priorLearning?.overall_percent || 0,
  );
  const learningTools = [
    {
      title: 'Course chapters',
      text: 'Resume lessons and see completion by chapter.',
      href: courseHref,
      icon: BookOpen,
    },
    {
      title: 'Assignments',
      text: 'Open required work, submissions, feedback, and due dates.',
      href: '/lms/assignments',
      icon: FileText,
    },
    {
      title: 'Quizzes & exams',
      text: 'Take assigned knowledge checks and license-prep exams.',
      href: '/lms/quizzes',
      icon: ClipboardCheck,
    },
    {
      title: 'Grades',
      text: 'Review quiz results, assignment grades, and instructor feedback.',
      href: '/lms/grades',
      icon: Award,
    },
    {
      title: 'Learning analytics',
      text: 'See activity, performance, and course progress together.',
      href: '/lms/analytics',
      icon: BarChart3,
    },
    {
      title: 'Calendar',
      text: 'Check theory sessions, due dates, and scheduled milestones.',
      href: '/lms/calendar',
      icon: CalendarDays,
    },
    {
      title: 'Study resources',
      text: 'Open your RTI plan, syllabus, and shared learning materials.',
      href: '/apprentice/rti',
      icon: FolderOpen,
    },
    {
      title: 'Skills portfolio',
      text: 'Upload evidence and track supervisor-verified competencies.',
      href: '/apprentice/competencies',
      icon: CheckCircle2,
    },
  ] as const;

  if (!runtime.contract) {
    const billingConfigured = Boolean(
      cosmetologyBilling?.fully_paid || cosmetologyBilling?.stripe_subscription_id,
    );
    const todoItems = [
      {
        label: 'Authorize automatic tuition payments and save a card',
        done: billingConfigured,
        href: '/apprentice/billing',
        icon: CreditCard,
      },
      {
        label: 'Complete learner orientation',
        done: Boolean(runtime.enrollment.orientation_completed_at),
        href: '/apprentice/orientation',
        icon: BookOpen,
      },
      {
        label: 'Read and acknowledge the student handbook',
        done: Boolean(handbookAcceptance?.id),
        href: '/apprentice/handbook',
        icon: ShieldCheck,
      },
      {
        label: `Complete required documents${missingDocumentCount ? ` (${missingDocumentCount} remaining)` : ''}`,
        done: (documentRequirements?.length || 0) > 0 && missingDocumentCount === 0,
        href: '/apprentice/documents',
        icon: FileText,
      },
      {
        label: 'Host Salon and supervisor verification',
        done: Boolean(runtime.placement?.id && runtime.placement.supervisor_user_id),
        href: '/apprentice/profile',
        icon: MapPin,
      },
      {
        label: 'RTI course content assigned and published',
        done: Boolean(runtime.enrollment.course_id && totalLessons > 0),
        href: courseHref,
        icon: BookOpen,
      },
    ];
    const incompleteCount = todoItems.filter((item) => !item.done).length;
    const shopName =
      runtime.shop?.name ||
      (runtime.placement?.id ? beautyProgram?.hostLabel || 'Assigned Host Shop' : 'Not connected');
    return (
      <main className="space-y-7 pb-10">
        <section className="relative min-h-[390px] overflow-hidden rounded-3xl bg-fuchsia-950 shadow-xl ring-1 ring-fuchsia-900/20">
          <Image
            src={heroImage}
            alt={`${displayProgram} apprentice training`}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-fuchsia-950/90 to-fuchsia-900/20" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/70 to-transparent" />
          <div className="relative z-10 flex min-h-[390px] max-w-3xl flex-col justify-center p-7 text-white sm:p-10 lg:p-12">
            <span className="w-fit rounded-full border border-pink-300/50 bg-pink-500/20 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-pink-100 backdrop-blur">
              {beautyProgram?.portalLabel || 'Apprentice Portal'}
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
              Welcome, {firstName}
            </h1>
            <p className="mt-3 text-xl font-bold text-pink-100">{displayProgram}</p>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-100 sm:text-base">
              Track training with your {beautyProgram?.hostLabel || 'Host Shop'},{' '}
              {registeredStandard?.completion.requiredRtiHours || 'required'} RTI hours, tuition
              progress, documents, competencies, and State Board readiness in one place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/apprentice/billing"
                className="rounded-xl bg-pink-600 px-5 py-3 font-black text-white shadow-lg hover:bg-pink-500"
              >
                Complete payment setup
              </Link>
              <Link
                href="/apprentice/documents"
                className="rounded-xl border border-white/50 bg-white/10 px-5 py-3 font-black text-white backdrop-blur hover:bg-white/20"
              >
                Required documents
              </Link>
            </div>
          </div>
        </section>
        <section className="rounded-3xl border-2 border-red-300 bg-red-50 p-6 shadow-sm">
          <div className="flex gap-3">
            <AlertCircle className="mt-1 h-6 w-6 shrink-0 text-red-700" />
            <div className="w-full">
              <h2 className="text-xl font-black text-red-950">
                Required to-do — {incompleteCount} incomplete
              </h2>
              <p className="mt-1 text-sm font-semibold text-red-900">
                PARIS will walk you through these items in order. Red items must be completed before
                the corresponding activity is unlocked.
              </p>
              <div className="mt-5 grid gap-3">
                {todoItems.map(({ label, done, href, icon: Icon }, index) => (
                  <Link
                    key={label}
                    href={href}
                    className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${done ? 'border-green-300 bg-green-50 text-green-950' : 'border-red-300 bg-white text-red-950'}`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${done ? 'bg-green-700 text-white' : 'bg-red-700 text-white'}`}
                      >
                        {done ? '✓' : index + 1}
                      </span>
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="font-black">{label}</span>
                    </span>
                    <span className="text-xs font-black uppercase">
                      {done ? 'Complete' : 'Open'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-3">
          <Metric
            label={beautyProgram?.hostLabel || 'Host Shop'}
            value={shopName}
            detail={
              runtime.placement?.supervisor_user_id
                ? 'Supervisor connected'
                : 'Supervisor verification still required'
            }
            icon={MapPin}
          />
          <Metric
            label="Required documents"
            value={`${Math.max(0, (documentRequirements?.length || 0) - missingDocumentCount)} / ${documentRequirements?.length || 0}`}
            detail={`${missingDocumentCount} incomplete`}
            icon={FileText}
          />
          <Metric
            label="Payment setup"
            value={billingConfigured ? 'Configured' : 'Required'}
            detail={
              billingConfigured
                ? 'Tuition billing is connected'
                : 'Review payment requirements in Billing'
            }
            icon={CreditCard}
          />
        </section>
        <TheorySchedulePanel
          schedule={theorySchedule}
          courseHref={courseHref}
          syllabusHref={beautyProgram?.syllabusHref || '/apprentice/rti'}
          completedLessons={completedLessons}
          totalLessons={totalLessons}
        />
        {priorLearning ? (
          <PriorLearningPanel priorLearning={priorLearning} nativePercent={digitalCoursePercent} />
        ) : null}
        <LearningCenter tools={learningTools} />
      </main>
    );
  }

  const progress = await loadRegisteredApprenticeshipProgress(db, runtime);
  const wage = resolveApplicableWage(runtime.contract, progress.competencies.completed);
  const nextWageMilestone =
    runtime.contract.standard.wageMilestones.find(
      (step) => step.completedCompetencies > progress.competencies.completed,
    ) || null;
  const shopName = runtime.contract.employer?.name || runtime.shop?.name || 'Not assigned';
  const supervisorName =
    runtime.supervisor?.full_name || runtime.supervisor?.email || 'Not assigned';
  const placementReady = Boolean(
    runtime.placement?.id &&
    runtime.placement.supervisor_user_id &&
    runtime.shop?.active !== false &&
    runtime.partner?.approval_status === 'approved' &&
    runtime.partner?.verification_status === 'verified' &&
    runtime.partner?.mou_signed &&
    runtime.partner?.onboarding_completed,
  );

  const actions = [
    {
      title: 'Clock work hours',
      text: 'Record geofenced supervised work time for Host Shop review. OJL hours remain evidence; competency verification controls competency-based progression.',
      href: '/apprentice/timeclock',
      image: '/images/pages/apprenticeship-structure.webp',
    },
    {
      title: 'Open RTI course',
      text: `${courseTitle} · ${digitalCoursePercent}% digital lesson completion`,
      href: courseHref,
      image: '/images/pages/training-classroom.webp',
    },
    {
      title: 'Competencies',
      text: `Review all ${runtime.contract.completion.competencyCount} registered competencies and supervisor verification.`,
      href: '/apprentice/competencies',
      image: '/images/pages/competency-test-hero.webp',
    },
    {
      title: 'Documents',
      text: 'Review required agreements, signatures, transfer evidence, and verified records.',
      href: '/apprentice/documents',
      image: '/images/pages/comp-home-highlight-success.webp',
    },
  ] as const;

  return (
    <main className="space-y-7 pb-10">
      <section className="min-h-[320px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:min-h-[400px]">
        <div className="grid min-h-[320px] lg:min-h-[400px] lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">
                  Apprentice Dashboard
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Welcome, {firstName}
                </h1>
                <p className="mt-3 text-lg font-bold text-slate-800">
                  {runtime.contract.standard.occupationTitle} Registered Apprenticeship
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-800">
                    Status:{' '}
                    {runtime.enrollment.enrollment_state ||
                      runtime.enrollment.status ||
                      'Active record'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-800">
                    Host Shop: {shopName}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-800">
                    Supervisor: {supervisorName}
                  </span>
                  <span className="rounded-full bg-cyan-100 px-3 py-1.5 text-cyan-900">
                    RAPIDS {runtime.contract.standard.rapidsCode} · competency-based
                  </span>
                </div>
              </div>
              <Link
                href="/apprentice/profile"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 font-bold text-slate-900 hover:bg-slate-50"
              >
                <UserRound className="h-5 w-5" /> Profile
              </Link>
            </div>
          </div>
          <div className="relative min-h-[230px] lg:min-h-full">
            <Image
              src={heroImage}
              alt={`${displayProgram} apprentice training`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section
        className={`rounded-2xl border p-5 ${placementReady ? 'border-cyan-200 bg-cyan-50 text-cyan-950' : 'border-amber-300 bg-amber-50 text-amber-950'}`}
      >
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h2 className="font-black">Registered-program contract</h2>
            <p className="mt-1 text-sm font-semibold leading-6">
              Completion requires {runtime.contract.completion.competencyCount} verified
              competencies and {runtime.contract.completion.requiredRtiHours} verified RTI hours
              under the active registered standard. Digital lesson completion is learning progress,
              not automatic RTI credit. Approved OJL remains auditable supervised-work evidence and
              is not used as a fabricated fixed completion denominator.
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-wide">
              {runtime.contract.standard.apprenticeToMentorRatio} mentor ratio ·{' '}
              {runtime.contract.standard.probationaryHours}-hour probation · standard{' '}
              {runtime.contract.standardVersionKey}
            </p>
            {!placementReady ? (
              <p className="mt-2 text-sm font-black">
                Regulated activity remains blocked until the Host Shop and assigned supervisor are
                fully operational.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
        aria-label="Apprentice progress"
      >
        <Metric
          label="Registered competencies"
          value={`${progress.competencies.completed} / ${progress.competencies.required}`}
          detail={`${progress.competencies.percent}% verified competency progress`}
          icon={CheckCircle2}
        />
        <Metric
          label="Verified RTI hours"
          value={`${progress.rti.verifiedHours.toFixed(2)} / ${progress.rti.requiredHours}`}
          detail={`${progress.rti.percent}% verified RTI · ${progress.rti.pendingEntries} pending entries`}
          icon={BookOpen}
        />
        <Metric
          label="Approved weekly OJL"
          value={progress.ojl.approvedHours.toLocaleString()}
          detail={`${progress.ojl.pendingEntries} pending work entries · approved supervised hours only`}
          icon={Clock3}
        />
        <Metric
          label="Verified transfer hours"
          value={
            progress.ojl.transferHoursVerified
              ? progress.ojl.transferHours.toLocaleString()
              : 'Pending'
          }
          detail={
            progress.ojl.transferHoursVerified
              ? `${progress.ojl.totalCreditedHours.toLocaleString()} total credited OJL hours`
              : 'Transcript evidence and reviewer approval required'
          }
          icon={ShieldCheck}
        />
        <Metric
          label="Certificates / documents"
          value={String(certsRes.count ?? 0)}
          detail={`${verifiedDocs} of ${totalDocs} documents verified`}
          icon={Award}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <ProgressPanel
          title="Registered competency mastery"
          value={progress.competencies.percent}
          detail={`${progress.competencies.completed} of ${progress.competencies.required} competencies verified`}
        />
        <ProgressPanel
          title="Verified Related Technical Instruction"
          value={progress.rti.percent}
          detail={`${progress.rti.verifiedHours.toFixed(2)} verified of ${progress.rti.requiredHours} required RTI hours`}
        />
        <ProgressPanel
          title="Learning journey"
          value={learningJourneyPercent}
          detail={
            priorLearning
              ? `${priorLearning.overall_percent}% prior learning preserved; ${completedLessons} of ${totalLessons} Elevate lessons complete`
              : `${completedLessons} of ${totalLessons} published lessons complete; this does not itself award RTI credit`
          }
        />
      </section>

      {priorLearning ? (
        <PriorLearningPanel priorLearning={priorLearning} nativePercent={digitalCoursePercent} />
      ) : null}

      <LearningCenter tools={learningTools} />

      <TheorySchedulePanel
        schedule={theorySchedule}
        courseHref={courseHref}
        syllabusHref={beautyProgram?.syllabusHref || '/apprentice/rti'}
        completedLessons={completedLessons}
        totalLessons={totalLessons}
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-black text-slate-950">Progressive wage checkpoint</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
          The applicable wage floor resolves the immutable occupation baseline and any
          employer-specific RAPIDS wage schedule without flattening one employer&apos;s schedule
          into the occupation standard.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
          <span className="rounded-full bg-slate-100 px-3 py-2">
            Current registered floor: ${wage.requiredRegisteredRate.toFixed(2)}/hr
          </span>
          {nextWageMilestone ? (
            <span className="rounded-full bg-amber-100 px-3 py-2 text-amber-950">
              Next baseline milestone: {nextWageMilestone.completedCompetencies} competencies → $
              {nextWageMilestone.hourlyRate.toFixed(2)}/hr
            </span>
          ) : (
            <span className="rounded-full bg-green-100 px-3 py-2 text-green-950">
              Final baseline competency milestone reached
            </span>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-black text-slate-950">Apprentice tools</h2>
          <p className="mt-1 text-sm font-medium text-slate-700">
            All tools use the same enrollment, placement, Host Shop, registered standard, and audit
            records.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-brand-red-300 hover:shadow-md"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                <Image
                  src={action.image}
                  alt=""
                  fill
                  sizes="(max-width:640px) 100vw,25vw"
                  className="object-cover transition-transform group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-5">
                <h3 className="font-black text-slate-950">{action.title}</h3>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-700">{action.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-brand-red-700" />
      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </article>
  );
}

function ProgressPanel({ title, value, detail }: { title: string; value: number; detail: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-black text-slate-950">{title}</h3>
        <span className="text-sm font-black text-slate-800">{value}%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-brand-red-600"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <p className="mt-3 text-sm font-medium leading-6 text-slate-700">{detail}</p>
    </article>
  );
}

function PriorLearningPanel({
  priorLearning,
  nativePercent,
}: {
  priorLearning: PriorLearningImport;
  nativePercent: number;
}) {
  const reviewLabel =
    priorLearning.status === 'approved'
      ? 'Approved'
      : priorLearning.status === 'verified_source'
        ? 'Source verified'
        : 'Sponsor review pending';
  return (
    <section
      className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm sm:p-8"
      aria-label="Prior learning record"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-800">
            Progress carried forward
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">
            {priorLearning.overall_percent}% of prior online learning preserved
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            This record keeps your previous chapter progress visible while Elevate maps equivalent
            lessons. You will not lose the work you already completed. Official RTI or competency
            credit remains subject to sponsor review and supporting evidence.
          </p>
        </div>
        <span className="w-fit rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-900 ring-1 ring-cyan-200">
          {reviewLabel}
        </span>
      </div>
      {priorLearning.modules?.length ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {priorLearning.modules.map((module) => (
            <article key={module.title} className="rounded-2xl border border-cyan-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-950">{module.title}</h3>
                <span className="text-sm font-black text-cyan-900">{module.percent}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-cyan-700"
                  style={{ width: `${module.percent}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      ) : null}
      <p className="mt-5 text-xs font-bold text-slate-600">
        Elevate-native lesson completion: {nativePercent}% · imported history is stored separately
        for auditability.
      </p>
    </section>
  );
}

function LearningCenter({
  tools,
}: {
  tools: ReadonlyArray<{
    title: string;
    text: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}) {
  return (
    <section aria-label="Learning center">
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-red-700">
          One learning center
        </p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">Everything you need for class</h2>
        <p className="mt-1 text-sm font-medium text-slate-700">
          Lessons, assessments, grades, calendar, resources, and portfolio evidence stay connected
          to the same Elevate enrollment.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tools.map(({ title, text, href, icon: Icon }) => (
          <Link
            key={title}
            href={href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-red-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-brand-red-700 transition group-hover:bg-brand-red-50">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-black text-slate-950">{title}</h3>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-700">{text}</p>
            <span className="mt-4 inline-flex text-sm font-black text-brand-red-700">Open →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const THEORY_DAY_LABELS: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

function TheorySchedulePanel({
  schedule,
  courseHref,
  syllabusHref,
  completedLessons,
  totalLessons,
}: {
  schedule: any;
  courseHref: string;
  syllabusHref: string;
  completedLessons: number;
  totalLessons: number;
}) {
  if (!schedule)
    return (
      <section className="rounded-3xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
        <h2 className="text-xl font-black text-amber-950">Theory schedule is being assigned</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">
          Your recurring theory schedule is created automatically from your active Host Shop
          placement. Return here after the placement record finishes syncing.
        </p>
      </section>
    );
  const days = (schedule.days_of_week || [])
    .map((day: number) => THEORY_DAY_LABELS[day])
    .filter(Boolean)
    .join(', ');
  const time = (value: string) => {
    const [hour, minute] = String(value).split(':').map(Number);
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(
      new Date(2020, 0, 1, hour, minute),
    );
  };
  return (
    <section className="rounded-3xl border border-fuchsia-200 bg-fuchsia-50 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.15em] text-fuchsia-800">
            Your weekly theory plan
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{days}</h2>
          <p className="mt-2 font-bold text-slate-800">
            {time(schedule.start_time)}–{time(schedule.end_time)} · {schedule.timezone}
          </p>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            Complete <strong>{schedule.weekly_target_minutes / 60} theory hours each week</strong>.
            Do not exceed{' '}
            <strong>{schedule.weekly_max_minutes / 60} theory hours in a full week</strong>. You
            will receive automatic alerts when each scheduled block starts and stops.
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            Course progress: {completedLessons} of {totalLessons} published lessons complete.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={courseHref}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-fuchsia-800 px-5 py-3 font-black text-white"
          >
            Start theory course
          </Link>
          <a
            href={syllabusHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-fuchsia-300 bg-white px-5 py-3 font-black text-fuchsia-950"
          >
            Open syllabus
          </a>
        </div>
      </div>
    </section>
  );
}
