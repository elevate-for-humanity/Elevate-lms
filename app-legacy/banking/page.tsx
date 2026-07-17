export const revalidate = 3600;

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Banking Services - Elevate for Humanity',
  description:
    'Direct deposit, prepaid card, and payment access support for Elevate for Humanity learners and partners.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/banking',
  },
};

export default function BankingPage() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Banking' }]} />
      </div>

      <section className="relative h-64 md:h-80 overflow-hidden">
        <Image
          src="/images/pages/banking-page-2.webp"
          alt="Banking services for Elevate for Humanity learners and partners"
          fill
          className="object-cover"
          priority
          sizes="100vw"
          
        />
      </section>

      <section className="pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Banking Services</h1>
          <p className="text-slate-600 text-lg max-w-xl">
            Payment access, direct deposit, and prepaid card support for learners, partners, and
            program operations.
          </p>
        </div>
      </section>

      <section className="py-5 border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm font-semibold text-slate-700">
            <span>FDIC Insured Partner Options</span>
            <span className="text-slate-300">|</span>
            <span>Direct Deposit Support</span>
            <span className="text-slate-300">|</span>
            <span>Prepaid Card Access</span>
            <span className="text-slate-300">|</span>
            <span>Program Payment Guidance</span>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-3">
            Banking Products
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Clear payment options for program participants who need reliable access to funds.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border-2 border-brand-blue-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative w-full aspect-[4/3]" style={{ aspectRatio: '16/10' }}>
                <Image
                  src="/images/pages/banking-page-2.webp"
                  alt="Program payment access support"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  
                />
              </div>
              <div className="p-7">
                <h3 className="text-xl font-bold text-slate-900 mb-3">Payment Access</h3>
                <p className="text-slate-600 mb-5">
                  Get help choosing a payment option that fits your program status and banking needs.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />
                    Learner and partner payment guidance
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />
                    Direct deposit setup support
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />
                    Prepaid card options when available
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />
                    Clear next steps before activation
                  </li>
                </ul>
                <Link
                  href="/contact"
                  className="block w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center px-6 py-3 rounded-lg font-bold transition-colors"
                >Ask About Banking</Link>
              </div>
            </div>

            <div className="bg-white border-2 border-brand-green-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative w-full aspect-[4/3]" style={{ aspectRatio: '16/10' }}>
                <Image
                  src="/images/pages/pathways-page-7.webp"
                  alt="Direct deposit support"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  
                />
              </div>
              <div className="p-7">
                <h3 className="text-xl font-bold text-slate-900 mb-3">Direct Deposit</h3>
                <p className="text-slate-600 mb-5">
                  Set up deposits to an existing bank account for straightforward program payments.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green-500 mt-1.5 flex-shrink-0" />
                    Bank account setup guidance
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green-500 mt-1.5 flex-shrink-0" />
                    Secure payment delivery
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green-500 mt-1.5 flex-shrink-0" />
                    No check-cashing step
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green-500 mt-1.5 flex-shrink-0" />
                    Works with most personal accounts
                  </li>
                </ul>
                <Link
                  href="/banking/direct-deposit"
                  className="block w-full bg-brand-green-600 hover:bg-brand-green-700 text-white text-center px-6 py-3 rounded-lg font-bold transition-colors"
                >See Details</Link>
              </div>
            </div>

            <div className="bg-white border-2 border-brand-blue-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative w-full aspect-[4/3]" style={{ aspectRatio: '16/10' }}>
                <Image
                  src="/images/pages/pathways-page-6.webp"
                  alt="Prepaid debit card support"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  
                />
              </div>
              <div className="p-7">
                <h3 className="text-xl font-bold text-slate-900 mb-3">Prepaid Card</h3>
                <p className="text-slate-600 mb-5">
                  Use prepaid card access when a traditional bank account is not the right fit.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />
                    No bank account required
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />
                    Everyday debit card use
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />
                    ATM access when supported
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />
                    FDIC-insured partner options
                  </li>
                </ul>
                <Link
                  href="/banking/prepaid-card"
                  className="block w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center px-6 py-3 rounded-lg font-bold transition-colors"
                >See Details</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                num: '1',
                title: 'Confirm Eligibility',
                desc: 'Review program status and payment access needs.',
              },
              {
                num: '2',
                title: 'Choose An Option',
                desc: 'Select direct deposit, prepaid card, or support from the team.',
              },
              {
                num: '3',
                title: 'Verify Details',
                desc: 'Confirm account or card information before activation.',
              },
              {
                num: '4',
                title: 'Receive Support',
                desc: 'Use the selected banking option for program-related payments.',
              },
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

      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div
              className="relative rounded-xl overflow-hidden aspect-[4/3]"
              style={{ aspectRatio: '4/3' }}
            >
              <Image
                src="/images/pages/pathways-page-7.webp"
                alt="Banking partner support for program payments"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Powered by EPS Financial</h2>
              <p className="text-slate-600 mb-6">
                Banking products are provided through EPS Financial, Member FDIC, with secure
                payment access options for eligible participants.
              </p>
              <div className="space-y-3 mb-6">
                {[
                  'FDIC-insured partner options',
                  'Direct deposit and prepaid card support',
                  'Clear activation steps for eligible participants',
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
                Learn more about EPS Financial
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
            Fees &amp; Disclosures
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 mb-3">Payment Access</h3>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li>Service availability depends on program status and partner eligibility.</li>
                <li>Fees, timing, and activation terms may vary by selected product.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-3">Direct Deposit</h3>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li>Requires a valid personal bank account.</li>
                <li>Processing timelines depend on the sending program and bank.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-3">Prepaid Card</h3>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li>Card terms and network access are provided by the issuing partner.</li>
                <li>Out-of-network ATM and replacement card fees may apply.</li>
              </ul>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-slate-700">
                <strong>Important:</strong> Banking products are provided through third-party
                financial partners. Terms, conditions, timing, and eligibility requirements apply.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            Need Help Choosing An Option?
          </h2>
          <p className="text-slate-600 mb-8">
            The team can help confirm which banking path is available for your program.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-8 py-4 rounded-lg font-bold transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/programs"
              className="border border-slate-300 text-slate-700 px-8 py-4 rounded-lg font-bold hover:bg-white transition-colors"
            >
              View Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
