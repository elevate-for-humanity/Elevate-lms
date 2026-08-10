import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2, Circle, FileSignature, FileUp, Store } from 'lucide-react';
import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';
import { getHostShopBoard } from '@/lib/partner/board';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Host Shop Onboarding | Elevate LMS',
  robots: { index: false, follow: false },
};

async function loadContext() {
  try {
    return await requireCurrentHostShopPartner();
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'HOST_SHOP_UNAUTHENTICATED') {
      redirect('/host-shop/login?redirect=/host-shop/onboarding');
    }
    redirect('/unauthorized');
  }
}

function StepCard({
  title,
  description,
  href,
  complete,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  complete: boolean;
  icon: typeof Store;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <Icon className="h-8 w-8 text-blue-700" />
        {complete ? (
          <CheckCircle2 className="h-6 w-6 text-green-700" />
        ) : (
          <Circle className="h-6 w-6 text-slate-400" />
        )}
      </div>
      <h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
      <p className="mt-4 text-sm font-black text-blue-700">{complete ? 'Review →' : 'Complete step →'}</p>
    </Link>
  );
}

export default async function HostShopOnboardingPage() {
  const { user, partner } = await loadContext();
  const board = await getHostShopBoard(user.id);
  const docsComplete =
    board.requiredDocumentCount > 0 &&
    board.acceptedDocumentCount === board.requiredDocumentCount;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Host Shop onboarding</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">{partner.dba || partner.name}</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">
            Complete the worksite profile, execute the apprenticeship MOU, and submit the required compliance documents. Each step writes directly to the partner record used by the Host Shop dashboard.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <StepCard
            title="Worksite profile"
            description="Confirm the licensed supervisor, compensation model, workers’ compensation status, insurance, phone, and website."
            href="/host-shop/onboarding/profile"
            complete={partner.onboarding_completed === true}
            icon={Store}
          />
          <StepCard
            title="Host Shop MOU"
            description="Review the registered-apprenticeship worksite agreement and execute it using an authorized electronic signature."
            href="/host-shop/onboarding/mou"
            complete={partner.mou_signed === true}
            icon={FileSignature}
          />
          <StepCard
            title="Compliance documents"
            description={`${board.acceptedDocumentCount} of ${board.requiredDocumentCount} required documents are currently accepted.`}
            href="/host-shop/onboarding/documents"
            complete={docsComplete}
            icon={FileUp}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          {partner.approval_status !== 'approved' || partner.status !== 'active' ? (
            <p className="font-bold text-amber-900">
              Your partner record is awaiting final approval. You can complete onboarding now; apprentice operations become available after approval.
            </p>
          ) : docsComplete && partner.mou_signed && partner.onboarding_completed ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-black text-green-800">All Host Shop onboarding requirements are complete.</p>
              <Link href="/host-shop/dashboard/board" className="rounded-xl bg-green-700 px-5 py-3 text-center font-black text-white hover:bg-green-800">
                Open operational board
              </Link>
            </div>
          ) : (
            <p className="font-semibold text-slate-700">
              Complete the unfinished steps above. Documents marked “In review” update after staff review.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
