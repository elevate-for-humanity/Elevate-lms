import {
  APPRENTICE_POLICY_KEYS,
  APPRENTICE_POLICY_VERSION,
} from '@/lib/apprenticeship/apprentice-policy';
import Image from 'next/image';
import Link from 'next/link';
import { requireAdminClient } from '@/lib/supabase/admin';
import type { ApprenticeshipRuntimeContext } from '@/lib/apprenticeship/runtime-context';
import type { LearnerBillingRequirement } from '@/lib/billing/learner-billing-requirement';
import { getProgramHeroImage } from '@/lib/images/programImages';
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
      .select('id,title,message')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5),
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
  const name =
    (profile as any)?.first_name || (profile as any)?.full_name?.split(' ')[0] || 'Apprentice';
  const identity = evaluateIdentityClockEligibility(
    (apprentice as any)?.created_at,
    (documents || []) as any[],
    Boolean(verification),
  );
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
  if (!failed && !acceptedPolicies.has(APPRENTICE_POLICY_KEYS.payment))
    actions.push({
      title: 'Review and sign your payment rules',
      text: 'Read the payment and communication policy. Once signed, it stays in your menu.',
      href: '/apprentice/policies/payments',
    });

  if (!failed && !identity.eligible)
    actions.push({
      title: 'Identity verification required for clock-in',
      text: 'Open Documents to complete your ID and selfie verification. Your work clock becomes available after verification.',
      href: '/apprentice/documents',
    });
  if (!runtime.enrollment.orientation_completed_at)
    actions.push({
      title: 'Complete your orientation',
      text: 'Review the guide, then acknowledge it from your own account.',
      href: '/apprentice/orientation',
    });
  if (billing.required && billing.status !== 'active')
    actions.push({
      title: 'Payment setup needs attention',
      text: 'Review your current payment setup and any required authorization.',
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
              Start with any alerts below. Choose <strong>Theory / My Lessons</strong> in the menu
              for class, or <strong>Timeclock</strong> for work. Your selected page opens here.
            </p>
            <p className="mt-3 text-sm text-slate-600">
              On your phone, tap the menu button to find the same tools.
            </p>
          </div>
          <div className="relative min-h-56 bg-neutral-200">
            <Image
              src={getProgramHeroImage(programSlug)}
              alt="Your apprenticeship training"
              fill
              priority
              sizes="(max-width: 767px) 100vw, 45vw"
              className="object-cover object-top"
            />
          </div>
        </div>
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
        {((notifications || []) as any[]).map((notice) => (
          <article key={notice.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-950">{notice.title}</h3>
            <p className="mt-1 whitespace-pre-line leading-6 text-slate-700">{notice.message}</p>
          </article>
        ))}
        {!failed && !actions.length && !(notifications as any[])?.length ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
            No new alerts. Choose your next training task from the menu.
          </p>
        ) : null}
      </section>
    </main>
  );
}
