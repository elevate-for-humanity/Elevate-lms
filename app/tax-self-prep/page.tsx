// app/tax-self-prep/page.tsx - Self-Preparation Tax Software (TurboTax Style)
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { CountUp } from '@/components/animations/CountUp';
import { BarChart, Lock, Smartphone, Zap,
  Phone
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/tax-self-prep',
  },
  title: 'Tax Self-Prep | Do Your Own Taxes Online',
  description:
    'Easy, guided tax preparation software. File your taxes yourself with step-by-step guidance. Free to start.',
};

export default async function TaxSelfPrepPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch tax prep pricing
  const { data: pricing } = await supabase
    .from('tax_services')
    .select('*')
    .eq('type', 'self_prep');
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Tax Services', href: '/tax' },
          { label: 'Self Prep' },
        ]}
      />
      {/* Hero - TurboTax Style */}
      <section className="relative    text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          {/* Hero Section */}
          <section className="relative h-[400px] md:h-[500px] flex items-center justify-center text-white overflow-hidden">
            <Image
              src="/images/courses/barber-apprenticeship-10002417-cover.jpg"
              alt="Hero"
              fill
              className="object-cover"
              quality={100}
              priority
              sizes="100vw"
            />

            <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Welcome</h1>
              <p className="text-base md:text-lg mb-8 text-gray-100">
                Transform your career with free training
              </p>
            </div>
          </section>

          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Do your taxes with confidence
            </h1>
            <p className="text-base md:text-lg mb-8 font-light">
              Easy, step-by-step guidance. Maximum refund guaranteed. Free to
              start.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/supersonic-fast-cash"
                className="px-12 py-5 bg-brand-orange-600 text-white font-bold text-xl rounded-full hover:bg-brand-orange-700 transition text-center shadow-2xl"
              >
                Start For Free →
              </Link>
            </div>
            <p className="text-sm opacity-90">
              • Free to start • Pay only when you file • Maximum refund
              guaranteed
            </p>
          </div>
        </div>
      </section>

      {/* Product Tiers - TurboTax Style */}
      <ScrollReveal>
        <section className="py-20 px-4 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-2xl md:text-3xl font-bold text-center mb-4 text-2xl md:text-3xl lg:text-2xl md:text-3xl">
              Choose the right product for you
            </h2>
            <p className="text-center text-black mb-16">
              All products include maximum refund guarantee and 100% accuracy
            </p>

            <div className="grid md:grid-cols-4 gap-6">
              {/* Free Edition */}
              <div className="bg-white border-2 border-slate-200 rounded-lg p-6 hover:border-brand-blue-600 hover:shadow-xl transition">
                <div className="text-center mb-6">
                  <h3 className="text-lg md:text-lg font-bold mb-2">
                    Free Edition
                  </h3>
                  <div className="text-4xl font-bold text-brand-blue-600 mb-2 text-2xl md:text-3xl lg:text-4xl">
                    $0
                  </div>
                  <div className="text-sm text-black">Federal & State</div>
                </div>
                <div className="mb-6">
                  <div className="text-sm font-semibold mb-3">Best for:</div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>W-2 income only</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Standard deduction</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Simple tax situations</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/tax-self-prep/start?plan=free"
                  className="block w-full px-6 py-3 bg-brand-blue-600 text-white font-bold text-center rounded-lg hover:bg-brand-blue-700 transition"
                >
                  Start Free
                </Link>
              </div>

              {/* Deluxe */}
              <div className="bg-white border-2 border-slate-200 rounded-lg p-6 hover:border-brand-blue-600 hover:shadow-xl transition">
                <div className="text-center mb-6">
                  <h3 className="text-lg md:text-lg font-bold mb-2">Deluxe</h3>
                  <div className="text-4xl font-bold text-brand-blue-600 mb-2 text-2xl md:text-3xl lg:text-4xl">
                    $39
                  </div>
                  <div className="text-sm text-black">
                    Federal + $39 State
                  </div>
                </div>
                <div className="mb-6">
                  <div className="text-sm font-semibold mb-3">
                    Everything in Free, plus:
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Itemized deductions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Mortgage interest</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Charitable donations</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/tax-self-prep/start?plan=deluxe"
                  className="block w-full px-6 py-3 bg-brand-blue-600 text-white font-bold text-center rounded-lg hover:bg-brand-blue-700 transition"
                >
                  Start Deluxe
                </Link>
              </div>

              {/* Premier - Most Popular */}
              <div className="bg-white border-2 border-brand-orange-600 rounded-lg p-6 shadow-xl relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-brand-orange-600 text-white text-xs font-bold rounded-full">
                  MOST POPULAR
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-lg md:text-lg font-bold mb-2">Premier</h3>
                  <div className="text-4xl font-bold text-brand-blue-600 mb-2 text-2xl md:text-3xl lg:text-4xl">
                    $69
                  </div>
                  <div className="text-sm text-black">
                    Federal + $39 State
                  </div>
                </div>
                <div className="mb-6">
                  <div className="text-sm font-semibold mb-3">
                    Everything in Deluxe, plus:
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Investment income</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Rental property income</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Priority support</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/tax-self-prep/start?plan=premier"
                  className="block w-full px-6 py-3 bg-brand-orange-600 text-white font-bold text-center rounded-lg hover:bg-brand-orange-700 transition"
                >
                  Start Premier
                </Link>
              </div>

              {/* Self-Employed */}
              <div className="bg-white border-2 border-slate-200 rounded-lg p-6 hover:border-brand-blue-600 hover:shadow-xl transition">
                <div className="text-center mb-6">
                  <h3 className="text-lg md:text-lg font-bold mb-2">
                    Self-Employed
                  </h3>
                  <div className="text-4xl font-bold text-brand-blue-600 mb-2 text-2xl md:text-3xl lg:text-4xl">
                    $99
                  </div>
                  <div className="text-sm text-black">
                    Federal + $39 State
                  </div>
                </div>
                <div className="mb-6">
                  <div className="text-sm font-semibold mb-3">
                    Everything in Premier, plus:
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Schedule C (business income)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Business expenses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>1099 income</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/tax-self-prep/start?plan=self-employed"
                  className="block w-full px-6 py-3 bg-brand-blue-600 text-white font-bold text-center rounded-lg hover:bg-brand-blue-700 transition"
                >
                  Start Self-Employed
                </Link>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-sm text-black">
                Not sure which product? Start for free and we'll recommend the
                right one for you.
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* How It Works */}
      <ScrollReveal>
        <section className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-2xl md:text-3xl font-bold text-center mb-16 text-2xl md:text-3xl lg:text-2xl md:text-3xl">
              How it works
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-brand-blue-600">
                  1
                </div>
                <h3 className="text-lg font-bold mb-3">
                  Answer simple questions
                </h3>
                <p className="text-black">
                  We'll ask you about your income, deductions, and credits in
                  plain English.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-brand-blue-600">
                  2
                </div>
                <h3 className="text-lg font-bold mb-3">
                  We fill out the forms
                </h3>
                <p className="text-black">
                  Our software automatically fills out all the right tax forms
                  for you.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-brand-blue-600">
                  3
                </div>
                <h3 className="text-lg font-bold mb-3">
                  Double-check everything
                </h3>
                <p className="text-black">
                  Review your return and make sure everything looks right before
                  filing.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-brand-blue-600">
                  4
                </div>
                <h3 className="text-lg font-bold mb-3">
                  E-file and get refund
                </h3>
                <p className="text-black">
                  File electronically and get your refund in as little as 8
                  days.
                </p>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Features */}
      <ScrollReveal>
        <section className="py-20 px-4 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-2xl md:text-3xl font-bold text-center mb-16 text-2xl md:text-3xl lg:text-2xl md:text-3xl">
              Why choose our self-prep software?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg">
                <div className="text-4xl mb-4 text-2xl md:text-3xl lg:text-4xl">
                  •
                </div>
                <h3 className="text-lg font-bold mb-3">
                  Maximum Refund Guaranteed
                </h3>
                <p className="text-black">
                  We guarantee you'll get the maximum refund you're entitled to,
                  or we'll refund your service fee.
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg">
                <div className="text-4xl mb-4 text-2xl md:text-3xl lg:text-4xl">
                  <Lock className="w-5 h-5 inline-block" />
                </div>
                <h3 className="text-lg font-bold mb-3">100% Secure</h3>
                <p className="text-black">
                  Bank-level encryption and multi-factor authentication protect
                  your data.
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg">
                <div className="text-4xl mb-4 text-2xl md:text-3xl lg:text-4xl">
                  💬
                </div>
                <h3 className="text-lg font-bold mb-3">
                  Expert Help Available
                </h3>
                <p className="text-black">
                  Get help from tax experts via chat, phone, or video call if
                  you need it.
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg">
                <div className="text-4xl mb-4 text-2xl md:text-3xl lg:text-4xl">
                  <Smartphone className="w-5 h-5 inline-block" />
                </div>
                <h3 className="text-lg font-bold mb-3">Mobile App</h3>
                <p className="text-black">
                  Do your taxes on your phone or tablet. Snap photos of W-2s and
                  upload instantly.
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg">
                <div className="text-4xl mb-4 text-2xl md:text-3xl lg:text-4xl">
                  <Zap className="w-5 h-5 inline-block" />
                </div>
                <h3 className="text-lg font-bold mb-3">Fast & Easy</h3>
                <p className="text-black">
                  Most people finish in under 30 minutes. Save and come back
                  anytime.
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg">
                <div className="text-4xl mb-4 text-2xl md:text-3xl lg:text-4xl">
                  <BarChart className="w-5 h-5 inline-block" />
                </div>
                <h3 className="text-lg font-bold mb-3">Import Last Year</h3>
                <p className="text-black">
                  Import last year's return from any major tax software to save
                  time.
                </p>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* CTA */}
      <section className="py-20 bg-brand-blue-600 text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-2xl md:text-3xl font-bold mb-6 text-2xl md:text-3xl lg:text-2xl md:text-3xl">
            Ready to do your taxes?
          </h2>
          <p className="text-base md:text-lg mb-8">
            Start for free. Pay only when you file. Maximum refund guaranteed.
          </p>
          <Link
            href="/supersonic-fast-cash"
            className="inline-block px-12 py-5 bg-brand-orange-600 text-white font-bold text-xl rounded-full hover:bg-brand-orange-700 transition shadow-2xl"
          >
            Start For Free →
          </Link>
          <p className="mt-6 text-sm opacity-90">
            Questions? Chat with us 24/7 or call (317) 314-3757
          </p>
        </div>
      </section>
      {/* CTA Section */}
      <section className="bg-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-blue-100 mb-6">Apply today for free career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center bg-white text-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="mailto:elevate4humanityedu@gmail.com"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
