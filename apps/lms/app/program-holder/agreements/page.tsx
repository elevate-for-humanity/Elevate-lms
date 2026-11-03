import Link from 'next/link';
import FullProgramHostAgreement from '@/components/program-holder/FullProgramHostAgreement';
import { PrintDocumentControl } from '@/components/program-holder/PrintDocumentControl';
import { ProgramHolderPaymentAddendum } from '@/components/program-holder/ProgramHolderPaymentAddendum';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import forms from '@/lib/program-holder/achieve-onboarding-forms.json';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Full onboarding forms | Elevate', robots: { index: false, follow: false } };
const ACHIEVE_HOLDER_ID = 'acc9f5ab-8804-432e-9b12-aac1a6c86426';

export default async function FullOnboardingFormsPage() {
  const context = await requireProgramHolder({ allowPendingApproval: true });
  if (context.mode === 'admin') return <p>Select a partner from the admin dashboard to review their documents.</p>;
  const { data: holder, error } = await context.db.from('program_holders').select('organization_name,features,mou_signed').eq('id', context.holderId).single();
  if (error) throw new Error('Assigned agreement could not load.');
  if (context.holderId !== ACHIEVE_HOLDER_ID) return <main className="mx-auto max-w-5xl space-y-5 p-5"><Link className="text-blue-800 underline" href="/program-holder/documents">Back to forms</Link><h1 className="text-3xl font-black">{holder.organization_name}: assigned agreements</h1><PrintDocumentControl /><ProgramHolderPaymentAddendum full />
    {Array.isArray(holder.features?.custom_mou?.requirements) && <section className="rounded-2xl border p-5"><h2 className="text-xl font-bold">Your role-specific requirements</h2><ul className="list-disc pl-5 space-y-2">{holder.features.custom_mou.requirements.filter((item: unknown) => typeof item === 'string').map((item: string)=><li key={item}>{item}</li>)}</ul></section>}
    <Link className="inline-flex min-h-12 items-center font-bold text-blue-800 underline" href="/program-holder/sign-mou">Review your personalized MOU, recorded original and signature status</Link>
    <Link className="inline-flex min-h-12 items-center font-bold text-blue-800 underline" href="/program-holder/non-compete">Read your confidentiality, non-compete and non-solicitation obligations</Link>
    <p className="text-sm">The full master terms below support your assigned MOU. Your executed individual agreement and addenda control any specific exceptions; this page does not recreate an absent original.</p><FullProgramHostAgreement /></main>;
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 text-slate-950 print:max-w-none">
      <div className="print:hidden">
        <Link href="/program-holder/dashboard" className="font-bold text-blue-700 underline">Back to dashboard</Link>
        <PrintDocumentControl />
        <h1 className="mt-4 text-3xl font-bold">Full CNA onboarding forms</h1>
        <p className="mt-3 leading-7">Your full MOU, NDA, and 12-month limited non-compete and non-solicitation forms are below. These drafts are available for review. Elevate must confirm the contracting legal entities and complete the payment schedule before enabling signature. No agreement is recorded as signed by viewing this page.</p>
        <Link href="/program-holder/documents" className="mt-3 inline-block font-bold text-blue-700 underline">Other onboarding documents</Link>
      </div>
      <article className="space-y-4 rounded-xl border bg-white p-5 sm:p-8 print:border-0 print:p-0">
        {forms.map((item, index) => item.heading
          ? <h2 key={index} className="pt-4 text-xl font-bold">{item.text}</h2>
          : <p key={index} className="whitespace-pre-wrap leading-7">{item.text}</p>)}
      </article>
    </main>
  );
}
