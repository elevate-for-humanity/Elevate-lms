import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { DocumentSignatureBlock } from '@/components/documents';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Program Holder MOU | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default async function SignMouPage() {
  const auth = await createClient();
  const db = await requireAdminClient();
  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/program-holder/sign-mou');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('id, full_name, program_holder_id')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile?.program_holder_id) {
    redirect('/apply/program-holder?status=pending');
  }

  const { data: holder } = await db
    .from('program_holders')
    .select('id, organization_name, status, approved_at, mou_signed')
    .eq('id', profile.program_holder_id)
    .maybeSingle();
  if (
    !holder ||
    !holder.approved_at ||
    !['approved', 'active'].includes(String(holder.status || ''))
  ) {
    redirect('/apply/program-holder?status=pending');
  }
  if (holder.mou_signed) {
    redirect('/program-holder/dashboard');
  }

  const { data: assignments } = await db
    .from('program_holder_programs')
    .select('program_id, programs(title,name,slug,credential_name,total_hours)')
    .eq('program_holder_id', holder.id)
    .eq('status', 'active');
  const programs = (assignments || []).map((item: any) => item.programs).filter(Boolean);
  const programNames =
    programs.map((program: any) => program.title || program.name).join(', ') ||
    'the approved assigned program';

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-800">
          Program Holder onboarding
        </p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Sign the Program Holder MOU</h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          Your application for <strong>{holder.organization_name}</strong> is approved. The MOU must
          be signed before the Program Holder dashboard is unlocked.
        </p>

        <section className="mt-7 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-950">
          <h2 className="font-black">Agreement incorporated by reference</h2>
          <p className="mt-2">
            This agreement is between Elevate for Humanity Career &amp; Technical Institute and
            <strong> {holder.organization_name}</strong>. It applies only to the currently assigned
            program{programs.length === 1 ? '' : 's'}: <strong>{programNames}</strong>. It covers
            applicant follow-up, enrollment, curriculum delivery, instructor oversight, attendance,
            hours, competency evidence, weekly progress reporting, privacy, completion records, and
            payment readiness.
          </p>
          <Link
            href="https://www.elevateforhumanity.org/legal/program-host-agreement"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex font-bold text-blue-800 underline"
          >
            Open the full Program Host terms incorporated into this MOU
          </Link>
        </section>

        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          <strong>After signature:</strong> your acceptance is recorded with timestamp and audit
          data. Dashboard access continues, but payout setup and fund access remain locked until the
          handbook, rights and non-compete acknowledgements, identity, business registration,
          insurance, W-9, program-specific credentials, and training plan have all been approved.
        </section>

        <DocumentSignatureBlock
          agreementType="program_holder_mou"
          agreementVersion={`3.0-${holder.id}`}
          buttonLabel="Sign Program Holder MOU & Continue"
          nextUrl="/program-holder/dashboard"
        />
      </div>
    </main>
  );
}
