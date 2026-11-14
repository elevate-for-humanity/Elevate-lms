import { PrintDocumentControl } from '@/components/program-holder/PrintDocumentControl';
import FullProgramHostAgreement from '@/components/program-holder/FullProgramHostAgreement';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Non-Compete and Non-Solicitation | Elevate',
  robots: { index: false },
};

export default async function NonCompetePage() {
  const context = await requireProgramHolder({ allowPendingApproval: true });
  if (context.holderId === 'acc9f5ab-8804-432e-9b12-aac1a6c86426') {
    const { data: holder, error } = await context.db.from('program_holders')
      .select('features').eq('id', context.holderId).maybeSingle();
    if (error || !holder) throw new Error('Agreement readiness could not be checked.');
    redirect('/program-holder/agreements');
  }
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-black uppercase tracking-widest text-amber-700">
        Required agreement
      </p>
      <h1 className="mt-2 text-3xl font-black">
        Confidentiality, non-solicitation, and limited non-compete terms
      </h1><PrintDocumentControl />
      <div className="mt-6 space-y-4">
        {[
          [
            'Protected relationships',
            'Do not divert Elevate-assigned applicants, enrolled learners, referral partners, funders, employers, or Host Shops into an outside competing arrangement using access obtained through Elevate.',
          ],
          [
            'Protected information',
            'Do not copy or misuse confidential curriculum, pricing, funding records, learner records, credentials, referral lists, operating procedures, or portal data.',
          ],
          [
            'Independent business activity',
            'These terms do not prohibit lawful work or operation of an independent business that does not misuse Elevate information or relationships.',
          ],
          [
            'Duration and enforceability',
            'Review the duration and scope in your executed individual agreement and the full master terms below. Individual amendments may differ. Confidentiality and learner-privacy duties continue as required by your agreement and applicable law.',
          ],
          [
            'Remedies and reporting',
            'Report suspected misuse, conflicts, or unauthorized disclosures promptly. Elevate may suspend access while investigating and may use available contractual or legal remedies.',
          ],
        ].map(([title, body]) => (
          <section key={title} className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-black">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>
          </section>
        ))}
      </div>
      <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">
        These cards are a reading guide. Review your assigned agreement and the full master
        terms below before signing. This page does not change an executed agreement.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/program-holder/documents"
          className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white"
        >
          Sign acknowledgements
        </Link>
        <Link
          href="/program-holder/agreements"
          className="rounded-xl border px-5 py-3 text-sm font-black"
        >
          Open my assigned agreements
        </Link>
      </div>
      <div className="mt-8"><FullProgramHostAgreement /></div>
    </main>
  );
}
