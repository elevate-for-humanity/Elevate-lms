import { actionableNoticeFilter, actionableNotices } from '@/lib/notifications/actionable-notices';
import {
  APPRENTICE_POLICY_KEYS,
  APPRENTICE_POLICY_VERSION,
} from '@/lib/apprenticeship/apprentice-policy';
import { loadPublishedLessonProgress } from '@/lib/apprenticeship/published-lesson-progress';
import { APPRENTICE_TIMECLOCK_URL } from '@/lib/portal/apprenticeship-portal-paths';
import { courseOverviewPath } from '@/lib/lms/routes';
import Image from 'next/image';
import Link from 'next/link';
import { requireAdminClient } from '@/lib/supabase/admin';
import type { ApprenticeshipRuntimeContext } from '@/lib/apprenticeship/runtime-context';
import type { LearnerBillingRequirement } from '@/lib/billing/learner-billing-requirement';
import { getProgramHeroImage, getProgramImageAlt } from '@/lib/images/programImages';
import { evaluateIdentityClockEligibility } from '@/lib/identity/clock-eligibility';

export default async function ApprenticeHomePanel({
  userId,
  programSlug,
  runtime,
  billing,
}: {
  userId: string;
  programSlug: string;
  runtime: ApprenticeshipRuntimeContext;
  billing: LearnerBillingRequirement;
}) {
  const db = await requireAdminClient();
  const results = await Promise.all([
    db.from('profiles').select('first_name,full_name').eq('id', userId).maybeSingle(),
    db
      .from('notifications')
      .select('id,title,message,created_at,idempotency_key,metadata')
      .eq('user_id', userId)
      .eq('read', false)
      .or(actionableNoticeFilter())
      .order('created_at', { ascending: false })
      .limit(50),
    db
      .from('apprentices')
      .select('created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle(),
    db
      .from('documents')
      .select('document_type,status,verification_status,verified,metadata')
      .eq('user_id', userId),
    db
      .from('id_verifications')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['approved', 'verified'])
      .limit(1)
      .maybeSingle(),
    db
      .from('apprentice_document_types')
      .select('document_type')
      .eq('program_slug', programSlug)
      .eq('is_required', true),
    db
      .from('agreement_acceptances')
      .select('agreement_key,agreement_version')
      .eq('subject_type', 'apprentice')
      .eq('subject_id', userId)
      .in('agreement_key', Object.values(APPRENTICE_POLICY_KEYS)),
  ]);
  const failed = results.some((result) => result.error);
  const [profile, notifications, apprentice, documents, verification, requirements, policies] =
    results.map((result) => result.data);
  // Keep announcements in one expandable area; setup tasks below use current records.
  const seenNotices = new Set<string>();
  const currentNotices = actionableNotices((notifications || []) as any[])
    .filter((notice) => {
      const key = `${notice.title || ''}:${notice.message || ''}`.trim().toLowerCase();
      if (seenNotices.has(key)) return false;
      seenNotices.add(key);
      return true;
    })
    .slice(0, 5);
  const name =
    (profile as any)?.first_name || (profile as any)?.full_name?.split(' ')[0] || 'Apprentice';
  const identity = evaluateIdentityClockEligibility(
    (apprentice as any)?.created_at,
    (documents || []) as any[],
    Boolean(verification),
  );
  const courseId = runtime.enrollment.course_id;
  const learning = courseId ? await loadPublishedLessonProgress(db, courseId, userId) : null;
  const paidInFull = runtime.enrollment.payment_status === 'paid_in_full';
  const learningTools = [
    {
      title: 'Workbook & reading',
      text: 'Review instruction and continue your saved workbook.',
      href: '/apprentice/workbook',
    },
    {
      title: 'Assignments',
      text: 'Open assigned work and review submission requirements.',
      href: '/lms/assignments',
    },
    {
      title: 'Quizzes & exams',
      text: 'Open your assigned knowledge checks and exams.',
      href: '/lms/quizzes',
    },
    {
      title: 'Grades & feedback',
      text: 'Review recorded results and instructor feedback.',
      href: '/lms/grades',
    },
    {
      title: 'Practical skills',
      text: 'Submit evidence and review supervisor-verified competencies.',
      href: '/apprentice/competencies',
    },
    {
      title: 'Class calendar',
      text: 'Check sessions, due dates and training milestones.',
      href: '/lms/calendar',
    },
    {
      title: 'My study times',
      text: 'Choose or update your theory study times outside shop work.',
      href: '/apprentice/theory-schedule',
    },
    {
      title: 'Progress & setup',
      text: 'Review your work hours, RTI, placement and setup records.',
      href: '/apprentice?view=records',
    },
  ];
  const actions: Array<{ title: string; text: string; href: string }> = [];
  const approved = new Set(
    ((documents || []) as any[])
      .filter((doc) =>
        ['approved', 'verified', 'accepted'].includes(
          String(doc.verification_status || doc.status || '').toLowerCase(),
        ),
      )
      .map((doc) => doc.document_type),
  );
  const missing = ((requirements || []) as any[]).filter(
    (item) => !approved.has(item.document_type),
  ).length;
  if (!failed && missing)
    actions.push({
      title: `${missing} required document${missing === 1 ? ' needs' : 's need'} attention`,
      text: 'Open Documents to see exactly what is missing or needs correction.',
      href: '/apprentice/documents',
    });
  const acceptedPolicies = new Set(
    ((policies || []) as any[])
      .filter((policy) => policy.agreement_version === APPRENTICE_POLICY_VERSION)
      .map((policy) => policy.agreement_key),
  );
  if (!failed && !acceptedPolicies.has(APPRENTICE_POLICY_KEYS.timeclock))
    actions.push({
      title: 'Review and sign your clock rules',
      text: 'Read the clock and location rules before recording shop work.',
      href: '/apprentice/policies/timeclock',
    });
  if (!failed && billing.required && !acceptedPolicies.has(APPRENTICE_POLICY_KEYS.payment))
    actions.push({
      title: 'Review and sign your payment rules',
      text: 'Read the payment and communication policy. Once signed, it stays in your menu.',
      href: '/apprentice/policies/payments',
    });

  if (!failed && !identity.eligible)
    actions.push({
      title: 'Identity verification required for clock-in',
      text: 'Your enrollment uploads are separate from secure clock verification. Open identity verification to complete the ID and selfie steps required for work clock access.',
      href: '/verify-identity',
    });
  if (!runtime.enrollment.orientation_completed_at)
    actions.push({
      title: 'Complete your orientation',
      text: 'Review the guide, then acknowledge it from your own account.',
      href: '/apprentice/orientation',
    });
  if (billing.required && billing.status !== 'active')
    actions.push({
      title:
        billing.status === 'configuration_required'
          ? 'Administration needs to configure billing'
          : billing.status === 'release_submitted'
            ? 'Payment authorization is under review'
            : 'Review your payment authorization',
      text:
        billing.status === 'configuration_required'
          ? 'Your billing setup has not been configured. Contact Administration from Billing & Payments; this is not a past-due notice.'
          : billing.status === 'release_submitted'
            ? 'Your submitted authorization is awaiting review. Check Billing & Payments for its current status.'
            : 'Open Billing & Payments to review the specific authorization step. This notice does not mean a payment is overdue.',
      href: '/apprentice/billing',
    });
  if (!runtime.placement?.supervisor_user_id)
    actions.push({
      title: 'Host Shop or supervisor connection needs attention',
      text: 'Check your placement details and contact program staff.',
      href: '/apprentice/profile',
    });
  return (
    <main className="mx-auto max-w-6xl space-y-6 pb-12" aria-label="Apprentice home">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid md:grid-cols-[1.1fr_1fr]">
          <div className="p-6 sm:p-8">
            <p className="text-sm font-semibold text-teal-800">Your apprentice dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Welcome, {name}</h1>
            <p className="mt-4 text-base leading-7 text-slate-700">
              Continue your course, open your workbook, or review feedback below. Record supervised
              shop work separately with the timeclock.
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Lesson completion, approved work hours and verified practical skills are tracked
              separately.
            </p>
          </div>
          <div className="relative min-h-56 bg-neutral-200">
            <Image
              src={getProgramHeroImage(programSlug)}
              alt={getProgramImageAlt(programSlug)}
              fill
              priority
              sizes="(max-width: 767px) 100vw, 45vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </section>
      <section
        aria-labelledby="apprentice-learning-title"
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="apprentice-learning-title" className="text-2xl font-bold text-slate-950">
              Your learning
            </h2>
            <p className="mt-2 max-w-2xl leading-7 text-slate-700">
              Study the lesson, complete its activities, review feedback, and submit practical
              evidence when required.
            </p>
          </div>
          <Link
            href={APPRENTICE_TIMECLOCK_URL}
            className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-4 py-3 font-semibold"
          >
            Open timeclock
          </Link>
        </div>
        {learning && courseId ? (
          <div className="mt-5 rounded-2xl border border-teal-200 bg-teal-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Your assigned course</h3>
                <p className="mt-1 text-slate-700">
                  {learning.completedLessons} of {learning.totalLessons} published lessons complete
                  · {learning.percent}%
                </p>
              </div>
              <Link
                href={courseOverviewPath(courseId)}
                className="inline-flex min-h-12 items-center rounded-xl bg-teal-800 px-5 py-3 font-bold text-white"
              >
                {learning.totalLessons > 0 && learning.completedLessons === learning.totalLessons
                  ? 'Review course'
                  : learning.completedLessons > 0
                    ? 'Continue course'
                    : 'Open course'}{' '}
                →
              </Link>
            </div>
            <progress
              className="mt-4 h-3 w-full accent-teal-800"
              max={100}
              value={learning.percent}
              aria-label="Published lesson completion"
            />
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Open the course outline to choose your available lesson. Required assessments and
              practical approvals still apply.
            </p>
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-slate-700">
            Your course assignment is not available yet. Contact program staff to confirm your
            training access.
          </p>
        )}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {learningTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-2xl border border-slate-200 p-4 transition hover:border-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-800"
            >
              <h3 className="font-bold text-slate-950">{tool.title} →</h3>
              <p className="mt-2 leading-6 text-slate-700">{tool.text}</p>
            </Link>
          ))}
        </div>
        {paidInFull ? (
          <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-950">
            Tuition paid in full. No payment setup is required.
          </p>
        ) : null}
      </section>
      <section aria-labelledby="apprentice-alerts-title" className="space-y-3">
        <h2 id="apprentice-alerts-title" className="text-xl font-bold text-slate-950">
          Alerts & next steps
        </h2>
        {failed ? (
          <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4">
            Some alerts could not load. Refresh this page or contact support.
          </p>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          {actions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="block rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950"
            >
              <h3 className="font-bold">{action.title}</h3>
              <p className="mt-1 leading-6">{action.text}</p>
              <span className="mt-2 inline-block font-semibold underline">Review this step →</span>
            </Link>
          ))}
        </div>
        {currentNotices.length ? (
          <details className="rounded-2xl border border-slate-200 bg-white p-5">
            <summary className="cursor-pointer font-bold text-slate-950">
              Messages &amp; training updates ({currentNotices.length})
            </summary>
            <p className="mt-2 text-sm text-slate-600">
              Earlier announcements are kept here. Use the current next steps above for setup
              status.
            </p>
            {currentNotices.map((notice) => (
              <article key={notice.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-slate-950">{notice.title}</h3>
                <p className="mt-1 whitespace-pre-line leading-6 text-slate-700">
                  {notice.message}
                </p>
              </article>
            ))}
          </details>
        ) : null}
        {!failed && !actions.length && !currentNotices.length ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
            No new alerts. Choose your next training task from the menu.
          </p>
        ) : null}
      </section>
    </main>
  );
}
