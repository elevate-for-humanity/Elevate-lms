export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/funding' },
  title: 'Funding & Financial Aid | Elevate For Humanity',
  description: 'Explore funding options for your career training — WIOA, WRG, JRI, payment plans, and more. Many students qualify for funded training.',
  openGraph: {
    title: 'Funding & Financial Aid | Elevate for Humanity',
    description: 'WIOA, WRG, JRI, payment plans, and more. Many students qualify for funded career training.',
    url: 'https://www.elevateforhumanity.org/funding',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/heroes-hq/funding-hero.jpg', width: 1200, height: 630, alt: 'Career training funding options' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Funding & Financial Aid | Elevate for Humanity',
    description: 'WIOA, WRG, JRI, payment plans, and more. Many students qualify for funded career training.',
    images: ['/images/heroes-hq/funding-hero.jpg'],
  },
};

export default function FundingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding & Financial Aid' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/heroes/hero-federal-funding.jpg" alt="Funding and financial aid" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Funding & Financial Aid</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              Multiple funding options are available to help cover your training costs. Many students qualify for state and federal programs that pay for tuition, books, and certifications.
            </p>
          </div>
        </div>
      </section>

      {/* Funding Options */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-2">Funding Options</h2>
          <p className="text-slate-800 text-sm text-center mb-6 sm:mb-8">Eligibility is determined by WorkOne, not Elevate. Register and schedule an appointment to find out what you qualify for. The process typically takes 1-3 weeks from registration to funding approval.</p>

          <div className="space-y-5 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6">
            {/* WIOA */}
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <div className="relative h-[180px]">
                <Image src="/images/heroes/workforce-partner-1.jpg" alt="WIOA funding" fill sizes="100vw" className="object-cover" />
                <div className="absolute top-3 left-3 bg-brand-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">Federal</div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-900 text-lg mb-2">WIOA — Workforce Innovation & Opportunity Act</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">
                  Federal funding that covers tuition, books, exam fees, and support services for qualifying adults and dislocated workers.
                </p>
                <div className="space-y-2 mb-4">
                  {['Covers tuition and training costs', 'Books and supplies included', 'Certification exam fees', 'Support services (childcare, transportation)'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-brand-blue-600 rounded-full flex-shrink-0" />
                      <span className="text-slate-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/wioa-eligibility" className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold text-sm hover:underline">
                  Learn about WIOA eligibility <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* WRG */}
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <div className="relative h-[180px]">
                <Image src="/images/heroes/workforce-partner-2.jpg" alt="Workforce Ready Grant" fill sizes="100vw" className="object-cover" />
                <div className="absolute top-3 left-3 bg-brand-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">State</div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-900 text-lg mb-2">WRG — Workforce Ready Grant</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">
                  Indiana state grant that covers tuition for high-demand certificate programs. Designed to get Hoosiers into high-wage careers quickly.
                </p>
                <div className="space-y-2 mb-4">
                  {['Covers tuition for eligible programs', 'High-demand industry certifications', 'No repayment required', 'Available to Indiana residents'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-brand-orange-500 rounded-full flex-shrink-0" />
                      <span className="text-slate-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <a href="https://www.nextleveljobs.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold text-sm hover:underline">
                  Learn about WRG at Next Level Jobs <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* JRI */}
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <div className="relative h-[180px]">
                <Image src="/images/heroes/workforce-partner-3.jpg" alt="JRI funding" fill sizes="100vw" className="object-cover" />
                <div className="absolute top-3 left-3 bg-brand-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">State</div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-900 text-lg mb-2">JRI — Justice Reinvestment Initiative</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">
                  State funding for justice-involved individuals. Covers training, certifications, and wraparound support services to help build a new career.
                </p>
                <div className="space-y-2 mb-4">
                  {['Full tuition coverage', 'Certification and exam fees', 'Transportation assistance', 'Case management support'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-brand-red-500 rounded-full flex-shrink-0" />
                      <span className="text-slate-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/programs/jri" className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold text-sm hover:underline">
                  Learn about JRI <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* OJT */}
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <div className="relative h-[180px]">
                <Image src="/images/homepage/funding-navigation.png" alt="On the job training" fill sizes="100vw" className="object-cover" />
                <div className="absolute top-3 left-3 bg-brand-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">Earn & Learn</div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-900 text-lg mb-2">OJT — On-the-Job Training</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">
                  Get hired and earn a paycheck while you train. Employers receive wage reimbursement from WorkOne, making them eager to hire and train you.
                </p>
                <div className="space-y-2 mb-4">
                  {['Paid from day one', 'Employer wage reimbursement (50-75%)', 'Leads to permanent employment', 'Available across industries'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-brand-green-600 rounded-full flex-shrink-0" />
                      <span className="text-slate-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/ojt-and-funding" className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold text-sm hover:underline">
                  Learn about OJT <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Self-Pay Options */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-2">Self-Pay Options</h2>
          <p className="text-slate-800 text-sm text-center mb-6 sm:mb-8">If you don&apos;t qualify for state or federal funding, we offer flexible payment options.</p>
          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4">
            {[
              { title: 'Pay in Full', desc: 'One-time payment at enrollment. Some programs offer a discount for full payment.', tag: 'Best Value' },
              { title: 'Payment Plan', desc: 'Split your tuition into monthly installments. No interest. Set up at enrollment.', tag: 'Flexible' },
              { title: 'Sezzle / Affirm', desc: 'Buy now, pay later. Break payments into 4-6 installments with Sezzle or Affirm.', tag: 'BNPL' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-5">
                <span className="text-xs font-bold text-brand-blue-600 bg-brand-blue-50 px-2 py-1 rounded-full">{item.tag}</span>
                <h3 className="font-bold text-slate-900 mt-3 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Get Funded */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6 sm:mb-8">How to Get Funded</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Register at Indiana Career Connect', desc: 'Create your free account at indianacareerconnect.com.', link: 'https://www.indianacareerconnect.com', linkText: 'Register Now →' },
              { step: '2', title: 'Schedule a WorkOne Appointment', desc: 'Visit your local WorkOne office to discuss funding options.', link: 'https://www.in.gov/dwd/workone/workone-locations/', linkText: 'Find WorkOne Locations →' },
              { step: '3', title: 'Get Your Eligibility Determined', desc: 'WorkOne reviews your situation and determines which programs you qualify for.' },
              { step: '4', title: 'Apply at Elevate', desc: 'Submit your student application and select your training program.', link: '/apply', linkText: 'Apply Now →' },
              { step: '5', title: 'Start Training', desc: 'Begin your program with funding in place.' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 bg-white rounded-lg border border-slate-200 p-4">
                <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{item.step}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                  {item.link && (
                    item.link.startsWith('http') ? (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-brand-blue-600 text-sm font-semibold hover:underline mt-1 inline-block">
                        {item.linkText}
                      </a>
                    ) : (
                      <Link href={item.link} className="text-brand-blue-600 text-sm font-semibold hover:underline mt-1 inline-block">
                        {item.linkText}
                      </Link>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 sm:py-14 bg-brand-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Find Out What You Qualify For</h2>
          <p className="text-white/90 mb-6 text-sm">Register at Indiana Career Connect and schedule a WorkOne appointment to explore your funding options.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer"
              className="bg-white text-brand-blue-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-blue-50 transition-colors text-center">
              Register at Indiana Career Connect <ArrowRight className="w-4 h-4 inline ml-1" />
            </a>
            <Link href="/apply" className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center">
              Apply for Training
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
