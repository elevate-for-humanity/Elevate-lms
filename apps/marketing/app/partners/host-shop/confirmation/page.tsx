import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import HostShopApplicationConversion from '@/components/partners/HostShopApplicationConversion';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Host Site Application Received | Elevate for Humanity',
  robots: { index: false, follow: false },
};

const HOST_SHOP_LOGIN = 'https://app.elevateforhumanity.org/host-shop/login';

export default async function HostSiteConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  const reference = params?.ref?.trim() || null;

  return (
    <main className="min-h-[75vh] bg-slate-50 px-4 py-12 text-slate-950">
      <HostShopApplicationConversion />
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <p className="text-sm font-black uppercase tracking-[0.15em] text-brand-red-700">
          Host Site application received
        </p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Your application is saved and onboarding can begin</h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          Elevate received your Host Site application and compliance documents. Your Host Shop account
          is provisioned for conditional onboarding while authorized staff verify licensing, insurance,
          workers&apos; compensation/exemption records, supervising professional credentials, worksite
          capacity, and program fit.
        </p>

        {reference ? (
          <div className="mt-6 rounded-xl border border-slate-300 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Reference number</p>
            <p className="mt-1 break-all font-mono text-sm font-black text-slate-950">{reference}</p>
          </div>
        ) : null}

        <div className="mt-7 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-950">
          <strong>Do this next:</strong>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Open the Host Shop portal using the same email address you entered on the application.</li>
            <li>Use the secure setup/sign-in link in your acknowledgment email, or request a magic link from the Host Shop login page.</li>
            <li>Complete the Host Site onboarding and MOU items shown in your portal.</li>
            <li>Watch the portal/email for any document clarification requested by Elevate.</li>
            <li>After final approval and apprentice matching, assigned apprentices will appear in the Host Shop board for OJL supervision, hours, and competency verification.</li>
          </ol>
        </div>

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          <strong>Important:</strong> Portal access is conditional onboarding access. It does not by itself
          approve the business to host an apprentice. Final Host Site approval remains an Elevate
          compliance decision.
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href={HOST_SHOP_LOGIN}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-red-700 px-5 py-3 font-bold text-white hover:bg-brand-red-800"
          >
            Open Host Shop Portal
          </a>
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
