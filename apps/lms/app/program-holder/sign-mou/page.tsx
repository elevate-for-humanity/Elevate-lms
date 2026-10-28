import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { DocumentSignatureBlock } from '@/components/documents';
import { ProgramHolderPaymentAddendum } from '@/components/program-holder/ProgramHolderPaymentAddendum';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Program Holder MOU | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default async function SignMouPage() {
  const context = await requireProgramHolder();
  if (context.mode === 'admin') redirect('/program-holder/dashboard');
  const db = context.db;
  const { data: holder, error } = await db.from('program_holders')
    .select('id,organization_name,status,approved_at,mou_signed,mou_final_pdf_url,features')
    .eq('id', context.holderId).maybeSingle();
  if (error || !holder) throw new Error('Program Holder agreement could not load.');
  // Do not sign the summary while this holder's full contract details await review.
  if (holder.id === 'acc9f5ab-8804-432e-9b12-aac1a6c86426' && holder.features?.full_forms_status === 'review_pending') {
    redirect('/program-holder/agreements');
  }
  const executedUrl = typeof holder.mou_final_pdf_url === 'string' && /^https:\/\//i.test(holder.mou_final_pdf_url) ? holder.mou_final_pdf_url : null;
  const requirements: string[] = Array.isArray(holder.features?.custom_mou?.requirements) ? holder.features.custom_mou.requirements.filter((value: unknown): value is string => typeof value === 'string') : [];

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
        <ProgramHolderPaymentAddendum full />
        <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-800">
          Program Holder onboarding
        </p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Sign the Program Holder MOU</h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          Your application for <strong>{holder.organization_name}</strong> is approved. Review the complete terms below. Your existing signature remains on record if you have already signed.
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

        {executedUrl && <a href={executedUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-5 font-bold text-white">Open your recorded MOU document</a>}
        {requirements.length > 0 && <section className="mt-6 rounded-xl border p-5"><h2 className="text-lg font-black">Your assigned agreement requirements</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{requirements.map(item => <li key={item}>{item}</li>)}</ul></section>}
        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          <strong>After signature:</strong> your acceptance is recorded with timestamp and audit
          data. Dashboard access continues, but payout setup and fund access remain locked until the
          handbook, rights and non-compete acknowledgements, identity, business registration,
          W-9, required business documents, program-specific credentials, and training plan have all been approved.
        </section>

        {holder.mou_signed ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-950">
            Your Program Holder MOU is recorded as signed. {executedUrl ? "Open the recorded document above to review your agreement." : "The executed document has not been attached to this record. Ask Elevate through Office Mail to attach the original; the general terms above are not a copy of your executed agreement."}
            <Link href="/program-holder/documents" className="mt-3 block font-bold underline">
              View other required documents and acknowledgements
            </Link>
          </div>
        ) : context.mode === 'preview' ? (
          <p className="mt-6 rounded-xl bg-blue-50 p-5">Administrator preview is read only. The Program Holder must sign from their own account.</p>
        ) : (
          <DocumentSignatureBlock
            agreementType="program_holder_mou"
            agreementVersion={`3.0-${holder.id}`}
            buttonLabel="Sign Program Holder MOU & Continue"
            nextUrl="/program-holder/dashboard"
          />
        )}
      </div>
    </main>
  );
}
