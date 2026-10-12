import Link from 'next/link';

export const BEAUTY_PROMOTION = {
  standardTuition: 6000,
  payInFullPrice: 5400,
  payInFullSavings: 600,
  standardDeposit: 600,
  promotionalDeposit: 300,
  depositSavings: 300,
  depositCode: 'OCT300',
  payInFullCode: 'PAYFULL600',
  endsOn: 'October 31, 2026',
} as const;

export function BeautyEnrollmentPromotion({ compact = false, programLabel, programSlug }: { compact?: boolean; programLabel?: string; programSlug?: string }) {
  const applyHref = programSlug ? `/programs/${programSlug}/apply` : '/barber-and-beauty-apprenticeships';
  const paymentHref = programSlug ? `/enroll/${programSlug}` : '/apprenticeships';
  return <section className={compact ? '' : 'border-y border-amber-200 bg-amber-50 px-4 py-8'}>
    <div className={compact ? 'rounded-2xl border border-amber-300 bg-amber-50 p-5' : 'mx-auto max-w-6xl rounded-2xl border border-amber-300 bg-white p-5'}>
      <p className="text-xs font-black uppercase tracking-wide text-amber-900">Self-pay apprenticeship tuition</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">Choose a payment path that fits your next step.</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">{programLabel || 'Barber, cosmetology, esthetics, and nail apprenticeships'}. Review the current program tuition and what is due now before you pay.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-4"><h3 className="font-black">Pay in full or use installments</h3><p className="mt-2 text-sm leading-6 text-slate-700">Your payment page shows the current total and available schedule. BNPL is separate financing and requires provider approval when offered.</p></div>
        <div className="rounded-xl bg-white p-4"><h3 className="font-black">Have a promotion code?</h3><p className="mt-2 text-sm leading-6 text-slate-700">Enter OCT300 or PAYFULL600 at checkout to check eligibility. The payment page confirms the discount, amount due, and expiration. Codes cannot be combined.</p></div>
      </div>
      <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">Apprenticeships are self-pay only. An inquiry is free; payment or an application alone does not confirm enrollment, employment, or placement.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row"><Link href={applyHref} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-red-600 px-5 py-3 text-sm font-black text-white">Start with program information</Link><Link href={paymentHref} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-900 bg-white px-5 py-3 text-sm font-black text-slate-950">Review current payment options</Link></div>
    </div>
  </section>;
}
