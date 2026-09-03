import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2, Circle, FileText, PenLine, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getHostShopBoard } from '@/lib/partner/board';

export const dynamic = 'force-dynamic';

export default async function HostShopOnboardingPage() {
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
      complete: board.requiredDocumentCount > 0 && board.acceptedDocumentCount === board.requiredDocumentCount,
      detail: `${board.acceptedDocumentCount} of ${board.requiredDocumentCount} required documents accepted.`,
      href: board.onboardingPaths.documents,
      icon: FileText,
    },
  ];

  const complete = steps.every((step) => step.complete);

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-brand-red-700">Host Site Onboarding</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{board.partner?.name || 'Host Shop'}</h1>
          <p className="mt-2 text-slate-600">
            Complete the compliance items below. New Host Site applications are submitted only through
            the public Host Site application; this page does not create a second application record.
          </p>
        </section>

        <section className="space-y-3">
          {steps.map(({ title, complete: isComplete, detail, href, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isComplete ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {isComplete ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div>
                    <h2 className="font-black text-slate-950">{title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{detail}</p>
                  </div>
                </div>
                {href && !isComplete && (
                  <Link href={href} className="rounded-lg bg-brand-blue-700 px-4 py-2 text-center text-sm font-bold text-white hover:bg-brand-blue-800">
                    Continue
                  </Link>
                )}
              </div>
            </article>
          ))}
        </section>

        <section className={`rounded-2xl border p-5 ${complete ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
          <div className="flex gap-3">
            {complete ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-700" /> : <Circle className="mt-0.5 h-5 w-5 text-slate-500" />}
            <div>
              <h2 className="font-black text-slate-950">{complete ? 'Onboarding requirements complete' : 'Onboarding still in progress'}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {complete
                  ? 'Your core Host Site compliance requirements are on file. Continue to the operational dashboard.'
                  : 'Complete the remaining items above. Elevate staff reviews submitted compliance documents before they count as accepted.'}
              </p>
              <Link href="/host-shop/dashboard" className="mt-4 inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50">
                Open Host Shop Dashboard
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
