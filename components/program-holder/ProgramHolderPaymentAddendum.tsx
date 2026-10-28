import Link from 'next/link';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { paymentAddendum } from '@/lib/program-holder/payment-addendum';
import { DocumentSignatureBlock } from '@/components/documents';

export async function ProgramHolderPaymentAddendum({ full = false, alertOnly = false }: { full?: boolean; alertOnly?: boolean }) {
  const ctx = await requireProgramHolder();
  if (ctx.mode === 'admin') return null;
  const { data: holder, error } = await ctx.db.from('program_holders').select('features,user_id')
    .eq('id', ctx.holderId).maybeSingle();
  if (error) throw new Error('Payment addendum could not load.');
  const terms = paymentAddendum(holder?.features, ctx.holderId);
  if (!terms) return null;
  const { data: acceptance, error: acceptanceError } = await ctx.db.from('license_agreement_acceptances')
    .select('id').eq('user_id', holder.user_id).eq('agreement_type', 'program_holder_mou')
    .eq('document_version', terms.version).maybeSingle();
  if (acceptanceError) throw new Error('Payment addendum signature status could not load.');
  if (alertOnly) return acceptance ? null : <p className="mt-4"><Link className="inline-flex min-h-11 items-center font-bold text-blue-900 underline" href="/program-holder/sign-mou">New payment addendum: review and sign your assigned terms</Link></p>;
  const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n / 100);
  return <section aria-label="Payment addendum" className="space-y-4 rounded-2xl border border-blue-300 bg-white p-6">
    <h2 className="text-2xl font-bold">{terms.title}</h2>
    <p className="font-semibold">{usd(terms.start_cents)} when training starts + {usd(terms.completion_cents)} at completion = {usd(terms.total_cents)} per eligible student.</p>
    <p>{acceptance ? 'Your acceptance of this payment addendum is recorded. Elevate countersignature and payment review remain separate.' : 'New payment addendum awaiting your signature. Your earlier MOU signature remains on record.'}</p>
    {full ? <>
      {terms.paragraphs.map((text, i) => <p key={i} className="whitespace-pre-wrap leading-7">{text}</p>)}
      <h3 className="text-xl font-bold">Completion payment release checklist</h3>
      <ul className="list-disc space-y-2 pl-6">{terms.checklist.map((text, i) => <li key={i}>{text}</li>)}</ul>
      {!acceptance && (ctx.mode === 'preview'
        ? <p>Administrator preview is read only. Carlina must sign from her own account.</p>
        : <DocumentSignatureBlock agreementType="program_holder_mou" agreementVersion={terms.version}
            buttonLabel="Sign payment addendum" nextUrl="/program-holder/sign-mou" />)}
    </> : <Link className="inline-flex min-h-12 items-center rounded-xl bg-blue-800 px-5 font-bold text-white" href="/program-holder/sign-mou">{acceptance ? 'Review payment addendum' : 'Review and sign payment addendum'}</Link>}
  </section>;
}
