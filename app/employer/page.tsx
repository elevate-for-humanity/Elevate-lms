export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/employer' },
  title: 'Employer Partnership | Elevate For Humanity',
  description: 'Hire pre-screened, trained candidates. Access WOTC tax credits, OJT wage reimbursement, and WIOA-funded upskilling at no cost.',
};

export default function EmployerPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Employer Partnership' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/hero-images/employer-hero.jpg" alt="Employer partnership" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">
              Hire Trained, Job-Ready Candidates
            </h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              We recruit, screen, and train workers for your open positions. You interview and hire — no recruiting fees.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works — single column on mobile */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6 sm:mb-8">How It Works</h2>
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-4 sm:gap-5">
            {[
              { step: '1', title: 'Tell Us Your Needs', desc: 'Submit your hiring needs — roles, skills, and timeline.', image: '/images/heroes/workforce-partner-3.jpg' },
              { step: '2', title: 'We Train Candidates', desc: 'We recruit and train workers in your specific skill requirements.', image: '/images/homepage/training-program-collage.png' },
              { step: '3', title: 'You Interview', desc: 'Meet pre-screened candidates. Only interview qualified people.', image: '/images/employers/partnership-meeting.jpg' },
              { step: '4', title: 'Hire & Save', desc: 'Hire with tax credits and wage reimbursements.', image: '/images/heroes/workforce-partner-1.jpg' },
            ].map((item) => (
              <div key={item.step} className="flex sm:flex-col gap-4 sm:gap-0 rounded-xl overflow-hidden border border-slate-200 bg-white">
                <div className="relative w-28 h-28 sm:w-full sm:h-[140px] flex-shrink-0 sm:flex-shrink">
                  <Image src={item.image} alt={item.title} fill sizes="100vw" className="object-cover" />
                  <div className="absolute top-2 left-2 w-7 h-7 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow">{item.step}</div>
                </div>
                <div className="py-3 pr-3 sm:p-4 flex-1">
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grants & Tax Credits — stacked on mobile */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-2">Save Money When You Hire</h2>
          <p className="text-slate-500 text-sm text-center mb-6 sm:mb-8">Grants and tax credits for qualifying hires</p>
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-5">
            {[
              { title: 'WOTC Tax Credit', amount: 'Up to $9,600 per hire', desc: 'Federal tax credit for hiring veterans, SNAP recipients, ex-felons, and other target groups. We help you file.', image: '/images/heroes/workforce-partner-4.jpg', href: '/funding' },
              { title: 'On-the-Job Training (OJT)', amount: '50-75% wage reimbursement', desc: 'Get reimbursed for training new hires. WorkOne pays a portion of wages during the training period.', image: '/images/heroes/workforce-partner-5.jpg', href: '/ojt-and-funding' },
              { title: 'WIOA Upskilling', amount: 'Tuition covered', desc: 'Upskill current employees with WIOA-funded training in healthcare, IT, skilled trades, and more.', image: '/images/heroes/hero-federal-funding.jpg', href: '/wioa-eligibility' },
              { title: 'Workforce Ready Grant', amount: 'State-funded certifications', desc: 'Indiana covers tuition for high-demand certifications through the WRG program.', image: '/images/heroes/hero-state-funding.jpg', href: '/funding' },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="flex gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-shadow group">
                <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={item.image} alt={item.title} fill sizes="100vw" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-brand-blue-600 font-semibold text-sm mb-1">{item.amount}</p>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6 sm:mb-8">What You Get</h2>
          <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-3">
            {['Pre-screened candidates', 'Skills-matched to your roles', 'No recruiting fees', 'Background checks available', 'Onboarding support', 'Ongoing retention help', 'Tax credit filing assistance', 'Dedicated account manager', 'Custom training programs'].map((item) => (
              <div key={item} className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3">
                <span className="w-2 h-2 bg-brand-blue-600 rounded-full flex-shrink-0" />
                <span className="text-slate-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 sm:py-14 bg-brand-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Start Hiring Today</h2>
          <p className="text-white mb-6 text-sm">Submit your hiring needs and we will match you with trained candidates.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply/employer" className="bg-white text-brand-blue-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-blue-50 transition-colors text-center">
              Submit Hiring Needs <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
            <Link href="/programs" className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center">
              View Training Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
