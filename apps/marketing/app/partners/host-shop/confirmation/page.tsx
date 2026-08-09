import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Host Site Application Received | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default async function HostSiteConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  const reference = params?.ref?.trim() || null;

  return (
    <main className="min-h-[75vh] bg-slate-50 px-4 py-12 text-slate-950">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <p className="text-sm font-black uppercase tracking-[0.15em] text-brand-red-700">
          Host Site application received
        </p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Your worksite review has started</h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          Elevate received your Host Site application and compliance documents. Submission does not
          authorize the business to host apprentices yet. Authorized staff must verify licensing,
          insurance, workers&apos; compensation/exemption records, supervising professional credentials,
          worksite capacity, and program fit before approval.
        </p>

        {reference ? (
          <div className="mt-6 rounded-xl border border-slate-300 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Reference number</p>
            <p className="mt-1 break-all font-mono text-sm font-black text-slate-950">{reference}</p>
          </div>
        ) : null}

        <div className="mt-7 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-950">
          <strong>What happens next:</strong> staff review the submitted records, contact the business
          if clarification is required, complete the Host Site approval workflow, and only then link
          eligible apprentices to the approved worksite.
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/partners/host-shops"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800"
          >
            Host Site Information
          </Link>
          <a
            href={`mailto:${PLATFORM_DEFAULTS.supportEmail}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-950 hover:bg-slate-50"
          >
            Contact Support
          </a>
        </div>
      </div>
    </main>
  );
}
