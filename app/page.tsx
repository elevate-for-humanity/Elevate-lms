
import Link from 'next/link';
import type { Metadata } from 'next';
import MarqueeBanner from '@/components/MarqueeBanner';
import { ProgramVideoCards } from '@/components/marketing/ProgramVideoCards';
import { HeroVideoBg } from '@/components/marketing/HeroVideoBg';

export const dynamic = 'force-static';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Elevate for Humanity | Workforce Training — Indianapolis, Indiana',
  description: 'DOL-registered apprenticeship sponsor and ETPL-approved training provider. Healthcare, skilled trades, CDL, and more. WIOA and state funding available for eligible programs.',
  keywords: 'workforce training Indianapolis, WIOA training Indiana, DOL registered apprenticeship, ETPL approved training provider, Elevate for Humanity',
  openGraph: {
    title: 'Elevate for Humanity | Workforce Training — Indianapolis, Indiana',
    description: 'DOL-registered apprenticeship sponsor and ETPL-approved training provider. Healthcare, skilled trades, CDL, and more.',
  },
};

export default function HomePage() {
  return (
    <main>

      {/* ── HERO ── */}
      <section className="flex flex-col lg:grid lg:grid-cols-2 gap-0">
        <div className="relative h-64 sm:h-80 lg:h-auto lg:min-h-[560px] overflow-hidden bg-slate-700">
          <HeroVideoBg
            src="/videos/homepage-hero-new.mp4"
            poster="/images/pages/comp-home-hero-programs.jpg"
            audioSrc="/audio/heroes/programs.mp3"
          />
        </div>
        <div className="bg-slate-700 flex items-center">
          <div className="px-5 py-10 sm:px-8 sm:py-12 lg:px-14 lg:py-16 w-full">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">
              DOL Registered · ETPL Approved · WIOA Compliant
            </p>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-5">
              Workforce training for real jobs in Indiana.
            </h1>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-8">
              Short-term programs. Industry credentials. Funding that can cover the full cost for eligible participants.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <Link href="/apply" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3.5 rounded-lg transition-colors text-sm text-center">
                Apply Now
              </Link>
              <Link href="/programs" className="border-2 border-white text-white font-bold px-6 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm text-center">
                See All Programs
              </Link>
              <Link href="/check-eligibility" className="border-2 border-white/50 text-white/80 font-bold px-6 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm text-center">
                Check Funding Eligibility
              </Link>
            </div>
            <p className="mt-5 text-white/60 text-xs">
              Questions? Call or text{' '}
              <a href="tel:3173143757" className="text-white/80 font-bold underline hover:text-brand-red-300 transition-colors">(317) 314-3757</a>
            </p>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <MarqueeBanner />

      {/* ── WHO THIS IS FOR ── */}
      <section className="bg-white py-16 px-6 border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-10 text-center">Who we work with</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: 'Learners',
                desc: 'Get trained, credentialed, and placed in a job — often at no cost through WIOA or state funding.',
                href: '/apply',
                cta: 'Apply Now',
                ctaClass: 'bg-brand-red-600 hover:bg-brand-red-700',
                accent: 'border-brand-red-500',
              },
              {
                label: 'Workforce Agencies',
                desc: 'Refer participants, track outcomes, and document WIOA compliance through a single system.',
                href: '/for-agencies',
                cta: 'Agency Info',
                ctaClass: 'bg-blue-600 hover:bg-blue-700',
                accent: 'border-blue-500',
              },
              {
                label: 'Employers',
                desc: 'Hire trained graduates, sponsor registered apprentices, and access OJT wage reimbursement.',
                href: '/for-employers',
                cta: 'Employer Info',
                ctaClass: 'bg-green-600 hover:bg-green-700',
                accent: 'border-green-500',
              },
              {
                label: 'Program Holders',
                desc: 'Deliver programs on Elevate infrastructure — LMS, compliance tracking, credentialing, and payments.',
                href: '/program-holder',
                cta: 'Partner With Us',
                ctaClass: 'bg-violet-600 hover:bg-violet-700',
                accent: 'border-violet-500',
              },
            ].map((b) => (
              <div key={b.label} className={`bg-white border-t-4 ${b.accent} rounded-xl shadow-sm p-6 flex flex-col`}>
                <h3 className="text-base font-bold text-slate-900 mb-2">{b.label}</h3>
                <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-5">{b.desc}</p>
                <Link href={b.href} className={`${b.ctaClass} text-white text-sm font-bold px-4 py-2.5 rounded-lg text-center transition-colors`}>
                  {b.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROGRAMS ── */}
      <section className="bg-slate-900 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 text-center">Programs</h2>
          <p className="text-white/70 text-sm text-center mb-10 max-w-xl mx-auto">
            Healthcare, skilled trades, CDL, technology, cosmetology, and more — each with a clear credential outcome.
          </p>
          <ProgramVideoCards />
          <div className="mt-10 text-center">
            <Link href="/programs" className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm">
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {/* ── FUNDING ── */}
      <section className="bg-brand-red-700 py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="w-full lg:max-w-2xl">
              <p className="text-white font-bold text-xs uppercase tracking-widest mb-3">Funding</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Workforce funding available for eligible programs</h2>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-6">
                Many of our programs qualify for federal and Indiana state workforce funding. Eligibility depends on the program, your background, and current funding availability. Check before you apply — it takes two minutes.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {[
                  { label: 'WIOA',                  tag: 'Federal',       desc: 'For adults, dislocated workers, and youth 16–24. Covers eligible high-demand programs.' },
                  { label: 'Workforce Ready Grant', tag: 'Indiana State', desc: 'Covers tuition for high-demand certification programs on the INDemand list.' },
                  { label: 'FSSA IMPACT',           tag: 'Indiana State', desc: 'Pays for training at no cost to current SNAP or TANF recipients. Elevate is a participating training provider.' },
                  { label: 'Job Ready Indy',        tag: 'Indianapolis',  desc: 'For justice-involved individuals and employer OJT partnerships.' },
                ].map((f) => (
                  <div key={f.label} className="bg-white rounded-xl p-4">
                    <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-1">{f.tag}</p>
                    <h3 className="text-slate-900 font-bold text-sm mb-1">{f.label}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
              <Link href="/check-eligibility" className="inline-block bg-white text-brand-red-700 font-bold px-6 sm:px-8 py-3.5 rounded-lg hover:bg-brand-red-50 transition-colors text-sm sm:text-base">
                Check My Eligibility
              </Link>
            </div>
            <div className="lg:flex-shrink-0 bg-white rounded-2xl p-8 text-center lg:w-64">
              <p className="text-4xl font-black text-brand-red-600 mb-2">Funded</p>
              <p className="text-slate-800 text-sm font-semibold mb-4">for eligible participants</p>
              <p className="text-slate-500 text-xs leading-relaxed">Funding covers tuition, books, tools, and exam fees for qualifying programs. Not all programs qualify — check eligibility first.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="bg-slate-800 py-14 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Ready to start?</h2>
          <p className="text-white/70 text-sm mb-8">
            Apply online, check your funding eligibility, or call us directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm text-center">
              Apply Now
            </Link>
            <Link href="/check-eligibility" className="border-2 border-white/40 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm text-center">
              Check Eligibility
            </Link>
          </div>
          <p className="mt-6 text-white/50 text-xs">
            Or call / text{' '}
            <a href="tel:3173143757" className="text-white/80 font-bold underline hover:text-brand-red-300 transition-colors">(317) 314-3757</a>
          </p>
        </div>
      </div>

    </main>
  );
}
