import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import forms from '@/lib/program-holder/achieve-onboarding-forms.json';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Full onboarding forms | Elevate', robots: { index: false, follow: false } };
const ACHIEVE_HOLDER_ID = 'acc9f5ab-8804-432e-9b12-aac1a6c86426';

export default async function FullOnboardingFormsPage() {
  const context = await requireProgramHolder({ allowPendingApproval: true });
  if (context.holderId !== ACHIEVE_HOLDER_ID) notFound();
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 text-slate-950 print:max-w-none">
      <div className="print:hidden">
        <Link href="/program-holder/dashboard" className="font-bold text-blue-700 underline">Back to dashboard</Link>
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
