import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { DocumentSignatureBlock } from '@/components/documents';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Program Holder MOU | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default async function SignMouPage() {
  const auth = await createClient();
  const db = await requireAdminClient();
  const { data: { user } } = await auth.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/program-holder/sign-mou');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('id, full_name, program_holder_id')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile?.program_holder_id) {
    redirect('/program-holder?error=pending-approval');
  }

  const { data: holder } = await db
    .from('program_holders')
    .select('id, organization_name, status, approved_at, mou_signed')
    .eq('id', profile.program_holder_id)
    .maybeSingle();
  if (!holder || !holder.approved_at || !['approved', 'active'].includes(String(holder.status || ''))) {
    redirect('/program-holder?error=pending-approval');
  }
  if (holder.mou_signed) {
    redirect('/program-holder/dashboard');
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-800">Program Holder onboarding</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Sign the Program Holder MOU</h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          Your application for <strong>{holder.organization_name}</strong> is approved. The MOU must be
          signed before the Program Holder dashboard is unlocked.
        </p>

        <section className="mt-7 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-950">
          <h2 className="font-black">Agreement incorporated by reference</h2>
          <p className="mt-2">
            By signing below, you acknowledge that you reviewed and accept the current Master Program
            Host Agreement, including Elevate&apos;s control of curriculum, enrollment, credentials,
            compliance, reporting, student records, and authorized program scope.
          </p>
          <Link
            href="/legal/program-host-agreement"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex font-bold text-blue-800 underline"
          >
            Open the full Master Program Host Agreement
          </Link>
        </section>

        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          <strong>After signature:</strong> your acceptance is recorded with timestamp and audit data,
          your Program Holder record is marked MOU signed, and you are sent to the Program Holder
          dashboard. Only programs explicitly authorized by {PLATFORM_DEFAULTS.orgName} will appear in
          your account.
        </section>

        <DocumentSignatureBlock
          agreementType="program_holder_mou"
          agreementVersion="1.0"
          buttonLabel="Sign Program Holder MOU & Continue"
          nextUrl="/program-holder/dashboard"
        />
      </div>
    </main>
  );
}
