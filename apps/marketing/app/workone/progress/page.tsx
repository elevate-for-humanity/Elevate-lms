import type { Metadata } from 'next';
import Link from 'next/link';

import WorkOneProgressForm from './WorkOneProgressForm';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Update WorkOne Progress',
  description: 'Update your WorkOne funding progress for your Elevate application.',
  robots: { index: false, follow: false },
};

export default async function WorkOneProgressPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : '';

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-blue-700">WorkOne Funding</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Update Your WorkOne Progress</h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-700">
            Use this form after you schedule, attend, submit funding paperwork, receive a decision, or need help. Elevate will receive every update and the next follow-up email will be generated for you.
          </p>
        </div>

        {token ? (
          <WorkOneProgressForm token={token} />
        ) : (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-950">
            <h2 className="font-black">Your private WorkOne progress link is required.</h2>
            <p className="mt-2 text-sm">
              Open the “WorkOne Program Sheet” email sent after your funded application and use the Update My WorkOne Progress link in that message.
            </p>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-slate-600">
          <p>Need help? Call {PLATFORM_DEFAULTS.supportPhone}.</p>
          <Link href="/" className="mt-3 inline-block font-bold text-brand-blue-700 hover:underline">Return to Elevate</Link>
        </div>
      </div>
    </main>
  );
}
