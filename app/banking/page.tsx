import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Banking Services - Powered by EPS Financial | Elevate for Humanity',
  description:
    'Fast refund advances, direct deposit, and prepaid card services. FDIC-insured banking powered by EPS Financial.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/banking',
  },
};

export default async function BankingPage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Banking' }]} />
      </div>

      {/* Hero */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <Image
          src="/images/pages/banking-page-2.jpg"
          alt="Tax preparation and banking services"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-slate-900/50" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Banking Services</h1>
            <p className="text-slate-200 text-lg max-w-xl">
              Refund advances, direct deposit, and prepaid cards — powered by EPS Financial, Member FDIC.
            </p>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-5 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm font-semibold text-slate-700">
            <span>FDIC Insured</span>
            <span className="text-slate-300">|</span>
            <span>IRS Approved E-File Provider</span>
            <span className="text-slate-300">|</span>
            <span>Same-Day Funding Available</span>
            <span className="text-slate-300">|</span>
            <span>No Credit Check Required</span>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-3">Banking Products</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Three ways to receive your tax refund. Choose what works best for your situation.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border-2 border-brand-blue-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
                <Image
                  src="/images/pages/tax-prep-desk.jpg"
                  alt="Tax preparer reviewing refund advance options with a client"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-7">
                <h3 className="text-xl font-bold text-slate-900 mb-3">Refund Advance</h3>
                <p className="text-slate-600 mb-5">
                  Get your refund faster with an advance loan. No credit check required.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-slate-700">
                  <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />Up to $6,000 advance</li>
                  <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />No credit check</li>
                  <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />Same-day funding available</li>
                  <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />Repaid from IRS refund</li>
                </ul>
                <Link href="/banking/refund-advance" className="block w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center px-6 py-3 rounded-lg font-bold transition-colors">
                  Learn More
                </Link>
              </div>
            </div>

            <div className="bg-white border-2 border-brand-green-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
                <Image
                  src="/images/pages/tax-preparation.jpg"
                  alt="Direct deposit tax refund processing"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-7">
                <h3 className="text-xl font-bold text-slate-900 mb-3">Direct Deposit</h3>
                <p className="text-slate-600 mb-5">
                  Get your refund deposited directly to your bank account — the fastest method available.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-slate-700">
                  <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-green-500 mt-1.5 flex-shrink-0" />Fastest refund method</li>
                  <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-green-500 mt-1.5 flex-shrink-0" />Secure and reliable</li>
                  <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-green-500 mt-1.5 flex-shrink-0" />No check cashing fees</li>
                  <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-green-500 mt-1.5 flex-shrink-0" />Track your refund status</li>
                </ul>
                <Link href="/banking/direct-deposit" className="block w-full bg-brand-green-600 hover:bg-brand-green-700 text-white text-center px-6 py-3 rounded-lg font-bold transition-colors">
                  Learn More
                </Link>
              </div>
            </div>

            <div className="bg-white border-2 border-brand-blue-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
                <Image
                  src="/images/pages/banking-page-2.jpg"
                  alt="Prepaid debit card for tax refund disbursement"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-7">
                <h3 className="text-xl font-bold text-slate-900 mb-3">Prepaid Card</h3>
                <p className="text-slate-600 mb-5">
                  Receive your refund on a prepaid Visa debit card. No bank account needed.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-slate-700">
                  <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />No bank account required</li>
                  <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />Use anywhere Visa is accepted</li>
                  <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />ATM access nationwide</li>
                  <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />FDIC insured</li>
                </ul>
                <Link href="/banking/prepaid-card" className="block w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center px-6 py-3 rounded-lg font-bold transition-colors">
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">How It Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '1', title: 'File Your Taxes', desc: 'Complete your tax return with our professional preparers.' },
              { num: '2', title: 'Choose Your Option', desc: 'Select refund advance, direct deposit, or prepaid card.' },
              { num: '3', title: 'Get Approved', desc: 'Quick approval process, usually within minutes.' },
              { num: '4', title: 'Receive Funds', desc: 'Get your money fast — same day or next day available.' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-blue-600 text-white text-xl font-black flex items-center justify-center mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EPS Financial Partner */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <Image
                src="/images/pages/tax-prep-desk.jpg"
                alt="Professional tax preparation services powered by EPS Financial"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Powered by EPS Financial</h2>
              <p className="text-slate-600 mb-6">
                All banking products are provided by EPS Financial, Member FDIC, with professional
                tax software integration. Your deposits are protected and your data is secure.
              </p>
              <div className="space-y-3 mb-6">
                {[
                  'FDIC insured — your deposits are protected',
                  'IRS-approved authorized e-file provider',
                  'Fast processing with same-day funding options',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <a
                href="https://www.epstax.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue-600 hover:text-brand-blue-800 font-semibold text-sm underline"
              >
                Learn more about EPS Financial →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Fees & Disclosures */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Fees &amp; Disclosures</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 mb-3">Refund Advance</h3>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li>• No application fee</li>
                <li>• No credit check</li>
                <li>• Interest rates vary by loan amount</li>
                <li>• Repaid automatically from IRS refund</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-3">Direct Deposit</h3>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li>• No fees for direct deposit</li>
                <li>• Fastest refund method available</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-3">Prepaid Card</h3>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li>• No monthly maintenance fee</li>
                <li>• Free ATM withdrawals at network ATMs</li>
                <li>• $2.50 fee for out-of-network ATMs</li>
                <li>• No overdraft fees</li>
              </ul>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-slate-700">
                <strong>Important:</strong> All banking products are provided by EPS Financial, Member FDIC.
                Refund advances are loans and must be repaid. Terms and conditions apply.
                See your tax professional for complete details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Ready to Get Started?</h2>
          <p className="text-slate-600 mb-8">
            File your taxes and choose the banking option that works best for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/start" className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-8 py-4 rounded-lg font-bold transition-colors">
              File Your Taxes
            </Link>
            <Link href="/contact" className="border border-slate-300 text-slate-700 px-8 py-4 rounded-lg font-bold hover:bg-white transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
