export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';
import EligibilityPreQualifier from '@/components/enrollment/EligibilityPreQualifier';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/wioa-eligibility' },
  title: 'WIOA Funding | Elevate For Humanity',
  description: 'Learn about WIOA, WRG, and JRI funding for career training in Indiana. Register at Indiana Career Connect and schedule a WorkOne appointment.',
};

export default function WIOAEligibilityPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'WIOA Funding' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[220px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/heroes/hero-federal-funding.jpg" alt="WIOA funded career training" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
              Get Your Training Funded
            </h1>
            <p className="text-base sm:text-xl text-white/90 max-w-xl">
              WIOA covers tuition, books, supplies, and certification fees. It&apos;s a grant — you never pay it back.
            </p>
          </div>
        </div>
      </section>

      {/* Quick eligibility pre-qualifier */}
      <section className="py-14 sm:py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <EligibilityPreQualifier />
        </div>
      </section>

      {/* 3 Steps — visual cards */}
      <section className="py-10 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-8">
            3 Steps to Get Funded
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                step: '1', title: 'Register Online',
                desc: 'Create your account at Indiana Career Connect — the state workforce portal.',
                image: '/images/homepage/funding-navigation.png',
                cta: 'Register Now', href: 'https://www.indianacareerconnect.com', external: true,
              },
              {
                step: '2', title: 'WorkOne Appointment',
                desc: 'Schedule a meeting at your local WorkOne center. They determine your funding eligibility.',
                image: '/images/heroes/hero-federal-funding.jpg',
                cta: 'Find WorkOne', href: 'https://www.in.gov/dwd/workone/workone-locations/', external: true,
              },
              {
                step: '3', title: 'Start Training',
                desc: 'Once approved, pick your program. WorkOne issues a voucher covering your costs.',
                image: '/images/homepage/training-program-collage.png',
                cta: 'View Programs', href: '/programs', external: false,
              },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <div className="relative h-[160px] sm:h-[180px]">
                  <Image src={item.image} alt={item.title} fill sizes="100vw" className="object-cover" />
                  <div className="absolute top-3 left-3 w-9 h-9 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow">
                    {item.step}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-3">{item.desc}</p>
                  {item.external ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-brand-blue-700 transition-colors">
                      {item.cta} <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <Link href={item.href}
                      className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-brand-blue-700 transition-colors">
                      {item.cta} <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Covered — 4 visual cards */}
      <section className="py-10 sm:py-14 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-8">
            What WIOA Covers
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { title: 'Tuition', image: '/images/homepage/earn-while-you-learn.png' },
              { title: 'Books & Supplies', image: '/images/homepage/certificate-of-completion.png' },
              { title: 'Certification Exams', image: '/images/hero/hero-certifications.jpg' },
              { title: 'Support Services', image: '/images/efh/sections/coaching.jpg' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl overflow-hidden border border-slate-100 bg-white">
                <div className="relative h-24 sm:h-32">
                  <Image src={item.image} alt={item.title} fill sizes="100vw" className="object-cover" />
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-semibold text-slate-900 text-sm">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Qualifies — compact grid */}
      <section className="py-10 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-2">
            Who Qualifies
          </h2>
          <p className="text-slate-500 text-sm text-center mb-8">WorkOne determines eligibility at your appointment</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              'Adults 18+ authorized to work in the US',
              'Indiana residents',
              'Unemployed or underemployed',
              'Receiving public assistance (SNAP, TANF, SSI)',
              'Veterans and eligible spouses',
              'Individuals with disabilities',
              'Justice-involved individuals',
              'Low-income households',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3">
                <span className="w-2 h-2 bg-brand-blue-600 rounded-full flex-shrink-0" />
                <span className="text-slate-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Other Funding — 3 cards */}
      <section className="py-10 sm:py-14 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-8">
            Other Funding Options
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { title: 'Workforce Ready Grant', desc: 'Indiana state grant for high-demand certifications. No income requirements.', href: '/funding', image: '/images/heroes/hero-state-funding.jpg' },
              { title: 'Justice Reinvestment (JRI)', desc: 'Funding for justice-involved individuals. Training, support, and job placement.', href: '/programs/jri', image: '/hero-images/jri-hero.jpg' },
              { title: 'Payment Plans', desc: 'Flexible payments, Sezzle, and Affirm for programs not covered by grants.', href: '/apply', image: '/images/store/platform-hero.jpg' },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="block rounded-2xl overflow-hidden border border-slate-200 bg-white hover:shadow-lg transition-shadow group">
                <div className="relative h-[140px] sm:h-[160px]">
                  <Image src={item.image} alt={item.title} fill sizes="100vw" className="object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-slate-600 text-sm mb-2">{item.desc}</p>
                  <span className="text-brand-blue-600 font-semibold text-sm group-hover:underline">Learn More →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — collapsible */}
      <section className="py-10 sm:py-14 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-8">FAQ</h2>
          <div className="space-y-2">
            {[
              { q: 'Do I have to pay anything back?', a: 'No. WIOA is a grant, not a loan.' },
              { q: 'How long does approval take?', a: 'Typically 1-2 weeks after your WorkOne appointment.' },
              { q: 'Can I work while in training?', a: 'Yes. Many students work part-time during training.' },
              { q: 'What if I have a criminal record?', a: 'You can still qualify. JRI funding is specifically for justice-involved individuals.' },
              { q: 'What programs are eligible?', a: 'Healthcare, Skilled Trades, CDL, IT, Barbering, and more.' },
            ].map((faq) => (
              <details key={faq.q} className="bg-slate-50 rounded-lg border border-slate-200 group">
                <summary className="p-4 cursor-pointer font-semibold text-slate-900 text-sm flex justify-between items-center">
                  {faq.q}
                  <svg className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-4 pb-4 text-slate-600 text-sm">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 sm:py-14 bg-brand-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Ready to Get Started?</h2>
          <p className="text-white mb-6 text-sm sm:text-base">
            Register, schedule your WorkOne appointment, and start training in weeks.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer"
              className="bg-white text-brand-blue-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-blue-50 transition-colors">
              Register at Indiana Career Connect
            </a>
            <Link href="/apply"
              className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors">
              Apply for Training
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
