import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata: Metadata = {
  title: 'Pricing | Supersonic Fast Cash Tax Preparation',
  description: 'Transparent, flat-fee tax preparation pricing. No surprise charges. Federal and state returns, refund advances, bookkeeping, and payroll.',
  alternates: { canonical: 'https://www.supersonicfastermoney.com/supersonic-fast-cash/pricing' },
};

/**
 * Pricing tiers — each links to /supersonic-fast-cash/apply?tier=<slug>
 * The apply form collects intake info, then routes to consent → Stripe payment.
 * A $49 deposit is collected via Stripe at /supersonic-fast-cash/payment.
 * The remaining balance is collected after return completion.
 */
const TIERS = [
  {
    name: 'Simple Return',
    price: '$89',
    deposit: '$49 deposit today',
    desc: 'W-2 income only. One federal return and one state return. Standard deduction. No dependents or one dependent.',
    image: '/images/pages/supersonic-tax-prep.jpg',
    href: '/supersonic-fast-cash/apply?tier=simple',
  },
  {
    name: 'Standard Return',
    price: '$149',
    deposit: '$49 deposit today',
    desc: 'W-2 income with dependents, Earned Income Tax Credit, Child Tax Credit, and itemized deductions. Federal and state included.',
    image: '/images/pages/supersonic-page-2.jpg',
    href: '/supersonic-fast-cash/apply?tier=standard',
    featured: true,
  },
  {
    name: 'Self-Employed',
    price: '$249',
    deposit: '$49 deposit today',
    desc: 'Schedule C self-employment income, 1099-NEC, business expenses, home office deduction, and quarterly estimated tax guidance.',
    image: '/images/pages/supersonic-tax.jpg',
    href: '/supersonic-fast-cash/apply?tier=self-employed',
  },
  {
    name: 'Complex Return',
    price: 'From $349',
    deposit: '$49 deposit today',
    desc: 'Rental income (Schedule E), investment sales (Schedule D), multiple states, S-Corp or partnership K-1s, or prior year amendments.',
    image: '/images/pages/finance-accounting.jpg',
    href: '/supersonic-fast-cash/apply?tier=complex',
  },
];

const ADD_ONS = [
  { name: 'Refund Advance', price: 'No fee', desc: 'Up to $7,500 same-day advance. Zero interest. Repaid from your IRS refund automatically.', image: '/images/pages/supersonic-page-2.jpg' },
  { name: 'Audit Protection', price: 'Included', desc: 'Full IRS representation included with all professionally prepared returns. No additional charge.', image: '/images/pages/supersonic-page-8.jpg' },
  { name: 'Additional State', price: '+$49', desc: 'Each additional state return beyond the first. Most returns include one state.', image: '/images/pages/supersonic-page-10.jpg' },
  { name: 'Prior Year Return', price: '+$75', desc: 'Amend or file a prior year return. Available for up to 3 years back.', image: '/images/pages/admin-tax-filing-hero.jpg' },
  { name: 'Bookkeeping', price: 'From $199/mo', desc: 'Monthly bookkeeping for small businesses. Includes reconciliation, P&L, and tax-ready books.', image: '/images/pages/finance-accounting.jpg' },
  { name: 'Payroll', price: 'From $99/mo', desc: 'Full-service payroll for up to 5 employees. Includes direct deposit, tax filings, and W-2s.', image: '/images/pages/supersonic-page-8.jpg' },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <SupersonicPageHero
        image="/images/pages/supersonic-page-1.jpg"
        alt="Supersonic Fast Cash transparent tax preparation pricing"
        title="Transparent Pricing"
        subtitle="Flat fees. No surprise charges. You know the cost before we start."
      />

      {/* TIERS */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-14">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Tax Preparation Fees</h2>
            <p className="text-xl text-black max-w-2xl leading-relaxed">
              All fees are flat-rate and disclosed before you sign. Federal and state returns are included in every tier.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TIERS.map((tier) => (
              <div key={tier.name} className={`rounded-2xl overflow-hidden flex flex-col border-2 ${tier.featured ? 'border-brand-red-600 shadow-xl' : 'border-slate-200'}`}>
                <div className="relative h-44 flex-shrink-0">
                  <Image src={tier.image} alt={tier.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
                </div>
                <div className="p-5 flex-1 bg-white flex flex-col">
                  {tier.featured && (
                    <span className="self-start bg-brand-red-600 text-white text-xs font-black px-3 py-1 rounded-lg mb-2">Most Popular</span>
                  )}
                  <p className="text-xs font-bold text-black uppercase tracking-wide mb-1">{tier.name}</p>
                  <p className="text-3xl font-black text-black mb-1">{tier.price}</p>
                  <p className="text-xs text-black mb-3">{tier.deposit} · balance due at completion</p>
                  <p className="text-black text-sm leading-relaxed flex-1">{tier.desc}</p>
                  <Link href={tier.href} className="mt-5 block w-full text-center py-3 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors">
                    Start My Return
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ADD-ONS */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Add-Ons & Additional Services</h2>
            <p className="text-xl text-black max-w-2xl leading-relaxed">Optional services available with any tax preparation package.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ADD_ONS.map((item) => (
              <div key={item.name} className="rounded-2xl overflow-hidden border border-slate-200 flex flex-col bg-white">
                <div className="relative h-40 flex-shrink-0">
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-slate-900">{item.name}</h3>
                    <span className="text-brand-red-600 font-black text-sm ml-2 flex-shrink-0">{item.price}</span>
                  </div>
                  <p className="text-black text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FREE VITA NOTE */}
      <section className="py-16 bg-emerald-50 border-y border-emerald-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="relative h-52 rounded-2xl overflow-hidden">
              <Image src="/images/pages/admin-analytics-hero.jpg" alt="Free VITA tax preparation" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">Qualify for Free Filing?</h3>
              <p className="text-black mb-6 leading-relaxed">
                If your household income is $67,000 or below, you may qualify for completely free tax preparation through Rise Up Foundation's VITA program. IRS-certified volunteers. No cost. No upsells.
              </p>
              <Link href="/tax/rise-up-foundation/free-tax-help" className="inline-block px-8 py-4 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-colors">
                Check VITA Eligibility
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative w-full">
        <div className="relative h-[40vh] min-h-[260px] overflow-hidden">
          <Image src="/images/pages/tax-prep-desk.jpg" alt="Start your tax return" fill className="object-cover object-center" sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-12 text-center px-4">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Ready to Get Started?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/supersonic-fast-cash/apply" className="px-10 py-4 bg-brand-red-600 text-white font-black text-xl rounded-xl hover:bg-brand-red-700 transition-colors">Apply Now</Link>
            <Link href="/supersonic-fast-cash/book-appointment" className="px-10 py-4 bg-white text-black font-black text-xl rounded-xl hover:bg-slate-100 transition-colors">Book Appointment</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
