import Link from 'next/link';

export const BEAUTY_PROMOTION = {
  standardTuition: 4980,
  payInFullPrice: 4380,
  payInFullSavings: 600,
  standardDeposit: 600,
  promotionalDeposit: 300,
  depositSavings: 300,
  depositCode: 'OCT300',
  payInFullCode: 'PAYFULL600',
  endsOn: 'October 31, 2026',
} as const;

export function BeautyEnrollmentPromotion({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? '' : 'border-y border-amber-200 bg-amber-50 px-4 py-8'}>
      <div className={compact ? 'rounded-2xl border-2 border-amber-300 bg-amber-50 p-5' : 'mx-auto max-w-6xl rounded-3xl border-2 border-amber-300 bg-white p-6 shadow-sm sm:p-8'}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-900">Limited-time enrollment promotion</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">$300 to start through October 31</h2>
        <p className="mt-2 text-sm font-semibold text-slate-700">Barber • Cosmetology • Nail Technician • Esthetician. First come, first served.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-wider text-slate-600">Deposit promotion</p>
            <p className="mt-2 text-lg font-bold text-slate-500 line-through">$600 deposit</p>
            <p className="text-3xl font-black text-slate-950">$300 to start</p>
            <p className="mt-2 text-sm font-bold text-amber-900">Coupon code: <span className="rounded bg-amber-200 px-2 py-1 font-black">OCT300</span></p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-wider text-slate-600">Pay in full & save $600</p>
            <p className="mt-2 text-lg font-bold text-slate-500 line-through">$6,000 tuition</p>
            <p className="text-3xl font-black text-slate-950">$5,400 pay in full</p>
            <p className="mt-2 text-sm font-bold text-amber-900">Coupon code: <span className="rounded bg-amber-200 px-2 py-1 font-black">PAYFULL600</span></p>
          </div>
        </div>
        <div className="mt-5 rounded-xl bg-emerald-50 p-4">
          <p className="font-black text-emerald-900">FREE to those who qualify</p>
          <p className="mt-1 text-sm leading-6 text-emerald-900">Eligible workforce funding may cover approved training costs. Funding is based on participant and program eligibility and agency authorization.</p>
        </div>
        <p className="mt-4 text-xs font-semibold leading-5 text-slate-600">Promotional codes cannot be combined. OCT300 applies only to the starting deposit. PAYFULL600 applies only when tuition is paid in full. Offers are subject to enrollment requirements and availability and end October 31, 2026.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/apply" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-red-600 px-5 py-3 text-sm font-black text-white hover:bg-brand-red-700">Apply Now</Link>
          <Link href="/check-eligibility" className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-slate-900 bg-white px-5 py-3 text-sm font-black text-slate-950">Check Funding Eligibility</Link>
        </div>
      </div>
    </section>
  );
}
