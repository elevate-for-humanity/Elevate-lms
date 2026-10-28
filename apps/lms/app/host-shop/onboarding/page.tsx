import { submitHostShopForReview } from './actions';
import { hostShopReadyForReview } from '@/lib/partners/host-shop-review';
import { requireAdminClient } from '@/lib/supabase/admin';
import StudentOnboardingLinks from '@/components/host-shop/StudentOnboardingLinks';
import Link from 'next/link';
import { HostShopHandbook } from '@/components/partners/HostShopHandbook';
import { redirect } from 'next/navigation';
import { CheckCircle2, Circle, FileText, PenLine, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getHostShopBoard } from '@/lib/partner/board';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';

export const dynamic = 'force-dynamic';

export default async function HostShopOnboardingPage({ searchParams }: {
  searchParams?: Promise<{ review?: string }>;
}) {
  const params = await searchParams;
  await requireRole(HOST_SHOP_ROLES);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/host-shop/login?redirect=/host-shop/onboarding');

  let board: Awaited<ReturnType<typeof getHostShopBoard>>;
  try {
    board = await getHostShopBoard(user.id);
  } catch (error) {
    if (error instanceof Error && error.message === 'HOST_SHOP_ACCESS_DENIED') {
      redirect('https://www.elevateforhumanity.org/partners/host-shop/apply');
    }
    throw error;
  }

  const steps = [
    {
      title: 'Business and supervisor profile',
      complete: Boolean(board.partner?.supervisor_name && board.partner?.supervisor_license_number && board.partner?.phone && board.partner?.compensation_model && board.partner?.workers_comp_status && board.partner?.has_general_liability && board.partner?.can_supervise_and_verify),
      detail: 'Confirm your contact information, licensed supervisor, and employment details.',
      href: board.onboardingPaths.forms,
      icon: FileText,
    },
    {
      title: 'Host Site approval',
      complete: board.partner?.approval_status === 'approved',
      detail:
        board.partner?.approval_status === 'approved'
          ? 'Elevate has approved this Host Site.'
          : 'Your application is still under review.',
      href: null,
      icon: ShieldCheck,
    },
    {
      title: 'Sign Host Shop MOU',
      complete: Boolean(board.partner?.mou_signed),
      detail: board.partner?.mou_signed
        ? 'The Host Shop MOU is signed.'
        : 'Review and electronically sign the worksite agreement.',
      href: board.onboardingPaths.signMou,
      icon: PenLine,
    },
    {
      title: 'Required compliance documents',
      complete:
        board.requiredDocumentCount > 0 &&
        board.acceptedDocumentCount === board.requiredDocumentCount,
      detail: `${board.acceptedDocumentCount} of ${board.requiredDocumentCount} required documents accepted.`,
      href: board.onboardingPaths.documents,
      icon: FileText,
    },
    {
      title: 'Host Shop orientation',
      complete: board.partner?.onboarding_completed === true,
      detail: 'Review the dashboard and program instructions. Sign your own orientation after your MOU and required documents are accepted.',
      href: '/host-shop/orientation',
      icon: FileText,
    },
  ];

  const complete = steps.every((step) => step.complete);
  const db = await requireAdminClient();
  const application = board.partner.partner_application_id
    ? await db.from('host_shop_applications').select('status').eq('id', board.partner.partner_application_id).maybeSingle()
    : null;
  if (application?.error) throw new Error('HOST_SHOP_APPLICATION_STATUS_UNAVAILABLE');
  const readyForReview = hostShopReadyForReview({ ...board.partner, name: board.partner.name || 'Host Shop' }, board);

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-brand-red-700">
            Host Site Onboarding
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            {board.partner?.name || 'Host Shop'}
          </h1>
          <p className="mt-2 text-slate-600">
            Complete the compliance items below. New Host Site applications are submitted only
            through the public Host Site application; this page does not create a second application
            record.
          </p>
        </section>

        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="text-xl font-black text-slate-950">Read your Host Shop handbook</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Your program responsibilities are available while onboarding is in progress. The host
            shop provides supervised hands-on training; Elevate handles theory and RTI.
          </p>
          <a
            href="#handbook"
            className="mt-3 inline-flex min-h-11 items-center font-bold text-blue-800 underline"
          >
            Read handbook and program responsibilities
          </a>
        </section>
        <StudentOnboardingLinks shopName={board.partner?.name || 'Host Shop'} />
        <HostShopHandbook />
        {params?.review === 'incomplete' ? <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 font-bold text-red-900">Complete your business/supervisor profile, sign the MOU, and upload every required document before submitting for review.</p> : null}
        {application?.data?.status === 'drafted' ? (
          <section className="rounded-2xl border border-slate-300 bg-white p-6">
            <h2 className="text-xl font-black text-slate-950">Submit your saved application for review</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">After completing your profile, signing your MOU, and uploading all required documents, send your application to Elevate. Documents may still be pending staff review; submission does not approve your shop.</p>
            <form action={submitHostShopForReview}><button disabled={!readyForReview} className="mt-4 min-h-12 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:bg-slate-500">Submit for review</button></form>
            {!readyForReview ? <p className="mt-2 text-sm text-slate-700">Complete the linked profile, MOU, and required uploads below to enable submission.</p> : null}
          </section>
        ) : application?.data?.status === 'submitted' ? <p role="status" className="rounded-xl border border-green-300 bg-green-50 p-4 font-semibold text-green-950">Your application is submitted for Elevate review. Pending document reviews remain visible below.</p> : null}

        <section className="space-y-3">
          {steps.map(({ title, complete: isComplete, detail, href, icon: Icon }) => (
            <article
              key={title}
              className={`rounded-2xl border p-5 shadow-sm ${
                isComplete ? 'border-green-200 bg-white' : 'border-red-300 bg-red-50'
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isComplete ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h2
                      className={
                        isComplete ? 'font-black text-slate-950' : 'font-black text-red-950'
                      }
                    >
                      {title}
                    </h2>
                    <p
                      className={
                        isComplete
                          ? 'mt-1 text-sm text-slate-600'
                          : 'mt-1 text-sm font-semibold text-red-900'
                      }
                    >
                      {detail}
                    </p>
                  </div>
                </div>
                {href && !isComplete && (
                  <Link
                    href={href}
                    className="rounded-lg bg-brand-blue-700 px-4 py-2 text-center text-sm font-bold text-white hover:bg-brand-blue-800"
                  >
                    Continue
                  </Link>
                )}
              </div>
            </article>
          ))}
        </section>

        <section
          className={`rounded-2xl border p-5 ${complete ? 'border-green-200 bg-green-50' : 'border-red-300 bg-red-50'}`}
        >
          <div className="flex gap-3">
            {complete ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-700" />
            ) : (
              <Circle className="mt-0.5 h-5 w-5 text-red-700" />
            )}
            <div>
              <h2 className="font-black text-slate-950">
                {complete ? 'Onboarding requirements complete' : 'Onboarding still in progress'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {complete
                  ? 'Your core Host Site compliance requirements are on file. Continue to the operational dashboard.'
                  : 'Complete the remaining items above. Elevate staff reviews submitted compliance documents before they count as accepted.'}
              </p>
              <Link
                href="/host-shop/dashboard"
                className="mt-4 inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50"
              >
                Open Host Shop Dashboard
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
