export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import MarqueeBanner from '@/components/MarqueeBanner';
import TrustStrip from '@/components/TrustStrip';
import { BlurIn } from '@/components/animations/PremiumAnimations';
import CanonicalVideo from '@/components/video/CanonicalVideo';


export const metadata: Metadata = {
  title: 'Elevate for Humanity | Workforce Training — Indianapolis, Indiana',
  description: 'Indianapolis workforce training in healthcare, skilled trades, CDL, barbering, and technology. WIOA and state funding available for eligible Indiana residents. DOL Registered Apprenticeship Sponsor. ETPL approved.',
  keywords: 'workforce training Indianapolis, WIOA training Indiana, CNA certification Indianapolis, CDL training Indiana, barber apprenticeship Indianapolis, HVAC training Indiana, free job training Indianapolis, Elevate for Humanity',
  openGraph: {
    title: 'Elevate for Humanity | Workforce Training — Indianapolis, Indiana',
    description: 'Short-term career training in healthcare, skilled trades, CDL, barbering, and technology. Funding available for eligible Indiana residents.',
    url: 'https://www.elevateforhumanity.org',
    siteName: 'Elevate for Humanity',
    locale: 'en_US',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ── HERO — BARBER VIDEO ── */}
      <section className="grid lg:grid-cols-2">
        <div className="relative h-72 sm:h-96 lg:h-auto min-h-[520px] overflow-hidden bg-slate-900">
          <CanonicalVideo src="/videos/barber-hero.mp4" poster="/images/pages/barber-cutting.jpg" className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div className="bg-slate-900 flex items-center">
          <div className="px-8 py-12 lg:px-14 lg:py-16 max-w-xl w-full">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">Indianapolis, Indiana</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              We train adults for real jobs —<br className="hidden sm:block" /> in weeks, not years.
            </h1>
            <p className="text-slate-300 text-base leading-relaxed mb-8 max-w-xl">
              Short-term career training in healthcare, skilled trades, CDL, barbering, and technology.
              Most programs are available at no cost to eligible Indiana residents through WIOA and state funding.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/start" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-base">
                Start Here
              </Link>
              <Link href="/programs" className="border border-white/20 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-base">
                See All Programs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CPR — first program, attention block ── */}
      <section className="grid lg:grid-cols-2 border-t border-slate-800">
        <div className="relative h-72 sm:h-96 lg:h-auto min-h-[480px] overflow-hidden bg-slate-900">
          <Image src="/images/pages/cpr-training-real.jpg" alt="CPR training" fill className="object-cover object-center" sizes="(max-width: 1024px) 100vw, 50vw" />
        </div>
        <div className="bg-white flex items-center">
          <div className="px-8 py-12 lg:px-14 lg:py-16 max-w-xl w-full">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-3">CPR &amp; First Aid</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mb-4">
              Get CPR Certified — In the Comfort of Your Own Home
            </h2>
            <p className="text-slate-600 text-base leading-relaxed mb-6">
              Live instruction from a certified instructor. Mannequin shipped directly to your door. Complete your CPR certification without ever leaving home.
            </p>
            <ul className="space-y-2 mb-8">
              {[
                'Live instructor — real-time guidance, not a recording',
                'Mannequin shipped directly to your home',
                'CPR certified on completion — same day',
                'Free with any Elevate program enrollment',
              ].map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />{b}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href="/apply?program=cpr-first-aid" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-base">
                Get Enrolled Now
              </Link>
              <Link href="/programs/cpr-first-aid" className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-6 py-3.5 rounded-lg transition-colors text-sm">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CDL FULL-BLEED VIDEO — second hero ── */}
      <section className="border-t border-slate-200">
        <div className="relative w-full overflow-hidden bg-slate-900" style={{ height: 'clamp(320px, 42vw, 580px)' }}>
          <CanonicalVideo src="/videos/cdl-hero.mp4" poster="/images/pages/cdl-training.jpg" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute bottom-4 left-4">
            <span className="bg-slate-900/80 text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded backdrop-blur-sm">CDL Training</span>
          </div>
        </div>
        <div className="bg-slate-900 px-6 py-12 sm:py-16">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">Commercial Driver&apos;s License</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-4 max-w-2xl">CDL Class A — $55K–$80K Starting. Training in Weeks.</h2>
            <p className="text-slate-300 text-base leading-relaxed mb-8 max-w-2xl">Indiana&apos;s freight and logistics industry needs drivers now. Elevate&apos;s CDL program covers pre-trip inspection, backing maneuvers, and road skills — everything you need to pass the CDL skills test and start earning.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/programs/cdl-class-a" className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-6 py-3 rounded-lg transition-colors text-sm">See CDL Program</Link>
              <Link href="/funding" className="border border-white/20 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-lg transition-colors text-sm">Check Funding</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <MarqueeBanner />

      {/* ── TRUST STRIP ── */}
      <TrustStrip variant="compact" showAnimation />

      {/* ── CNA WAITLIST BANNER ── */}
      <section className="bg-brand-blue-700 border-b border-brand-blue-800 py-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-white text-sm sm:text-base leading-snug">
            CNA cohorts are anticipated to begin in October. Join the waiting list to receive official updates on enrollment, scheduling, and program details.
          </p>
          <a href="/cna-waitlist" className="flex-shrink-0 bg-white text-brand-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-brand-blue-50 transition-colors text-sm whitespace-nowrap">
            Join the CNA Waiting List
          </a>
        </div>
      </section>

      {/* ── SKILLED TRADES — copy left, video right, dark ── */}
      <section className="grid lg:grid-cols-2 border-t border-slate-800">
        <div className="bg-slate-900 flex items-center order-2 lg:order-1">
          <div className="px-8 py-12 lg:px-14 lg:py-16 max-w-xl w-full">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">Skilled Trades</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-4">HVAC, Welding, Electrical — Hands-On Training, Real Credentials</h2>
            <p className="text-slate-300 text-base leading-relaxed mb-6">Trades jobs pay $45K–$75K starting. Elevate&apos;s programs combine classroom instruction, hands-on lab work, and nationally recognized credentials — EPA 608, AWS, NCCER — in weeks, not years.</p>
            <ul className="space-y-2 mb-8">
              {['HVAC Technician — EPA 608 certified', 'Welding — AWS D1.1 structural certification', 'Electrical — NCCER Core + Level 1', 'All tools and safety gear provided'].map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />{b}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href="/programs?category=trades" className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-6 py-3 rounded-lg transition-colors text-sm">See Trades Programs</Link>
              <Link href="/credentials" className="border border-white/20 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-lg transition-colors text-sm">View Credentials</Link>
            </div>
          </div>
        </div>
        <div className="relative h-72 sm:h-96 lg:h-auto min-h-[460px] overflow-hidden bg-slate-900 order-1 lg:order-2">
          <CanonicalVideo src="/videos/electrician-trades.mp4" poster="/images/pages/comp-highlights-electrical.jpg" className="absolute inset-0 w-full h-full object-cover" />
        </div>
      </section>



      {/* ── STATS BAND ── */}
      <div className="bg-slate-950 border-t border-slate-800 py-10 sm:py-14">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">Workforce Outcomes</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '500+', label: 'Graduates Trained', sub: 'and counting' },
              { value: '30+', label: 'Employer Partners', sub: 'active hiring' },
              { value: '15+', label: 'Credentials Offered', sub: 'nationally recognized' },
              { value: '$0', label: 'Cost to Eligible Participants', sub: 'WIOA & state funded' },
            ].map((m) => (
              <div key={m.label}>
                <div className="text-3xl sm:text-4xl font-black text-brand-red-500 mb-1">{m.value}</div>
                <div className="text-sm font-semibold text-white mb-0.5">{m.label}</div>
                <div className="text-xs text-slate-500">{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BARBERING — video left, copy right ── */}
      <section className="grid lg:grid-cols-2 border-t border-slate-200">
        <div className="relative h-72 sm:h-96 lg:h-auto min-h-[460px] overflow-hidden bg-slate-900">
          <CanonicalVideo src="/videos/barber-training.mp4" poster="/images/pages/barber-apprentice-learning.jpg" className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div className="bg-white flex items-center">
          <div className="px-8 py-12 lg:px-14 lg:py-16 max-w-xl w-full">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-3">Barbering</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mb-4">Indiana Barber License — DOL Registered Apprenticeship</h2>
            <p className="text-slate-600 text-base leading-relaxed mb-6">Elevate is a DOL Registered Apprenticeship Sponsor for barbering. Earn while you learn — apprentices work in a licensed shop and complete their 2,000-hour Indiana requirement with a job already in hand.</p>
            <ul className="space-y-2 mb-8">
              {['DOL Registered Apprenticeship — earn while you learn', 'Indiana Barber License on completion', 'Placement in a licensed shop from day one', 'WIOA funding available for eligible participants'].map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />{b}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href="/programs/barber-apprenticeship" className="bg-slate-900 text-white hover:bg-slate-700 font-bold px-6 py-3 rounded-lg transition-colors text-sm">See Barber Program</Link>
              <Link href="/apprenticeships" className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-6 py-3 rounded-lg transition-colors text-sm">Learn About Apprenticeships</Link>
            </div>
          </div>
        </div>
      </section>



      {/* ── FUNDING ── */}
      <div className="bg-brand-red-700 border-t border-brand-red-800 py-14 sm:py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-200 font-bold text-xs uppercase tracking-widest mb-3">Funding</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Most participants pay $0 for training</h2>
          <p className="text-brand-red-100 leading-relaxed mb-10 max-w-2xl">Federal and Indiana state workforce funding covers tuition, books, tools, and certification exam fees for eligible participants.</p>
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              { label: 'WIOA', tag: 'Federal', desc: 'Covers tuition, books, tools, and exam fees for eligible adults, dislocated workers, and youth 16–24.' },
              { label: 'Workforce Ready Grant', tag: 'Indiana State', desc: 'Indiana state grant covering high-demand certification programs at no cost for eligible participants.' },
              { label: 'JRI — Job Ready Indy', tag: 'Indiana State', desc: 'Funded career training for eligible justice-involved individuals through Indiana DWD.' },
            ].map((f) => (
              <div key={f.label} className="bg-white/10 rounded-xl p-6">
                <p className="text-brand-red-200 text-xs font-bold uppercase tracking-widest mb-1">{f.tag}</p>
                <h3 className="text-white font-bold text-base mb-2">{f.label}</h3>
                <p className="text-brand-red-100 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/wioa-eligibility" className="bg-white text-brand-red-700 font-bold px-8 py-3.5 rounded-lg hover:bg-brand-red-50 transition-colors">Check My Eligibility</Link>
            <Link href="/funding" className="border border-white/40 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors">All Funding Options</Link>
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div className="bg-white border-t border-slate-100 py-16 sm:py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">Student Outcomes</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-10">Real students. Real results.</h2>
          <div className="divide-y divide-slate-200">
            {[
              { quote: "WIOA paid for my Medical Assistant training, and I started working right after graduation. Now I'm making $42,000 a year with full benefits.", name: 'Sarah M.', program: 'Medical Assistant', salary: '$42K/yr', photo: '/images/testimonials-hq/person-1.jpg' },
              { quote: "They provided an extremely informative and hospitable environment. I really enjoyed my classes. The staff made everything easy to understand.", name: 'Timothy S.', program: 'CDL Training', salary: '$55K/yr', photo: '/images/testimonials-hq/person-4.jpg' },
              { quote: "Anyone who wants to grow and make more money should try Elevate. You deserve it. The staff is amazing and easy to communicate with.", name: 'Jasmine R.', program: 'CNA Certification', salary: '$38K/yr', photo: '/images/testimonials-hq/person-3.jpg' },
            ].map((t) => (
              <div key={t.name} className="flex flex-col sm:flex-row gap-6 py-8">
                <Image src={t.photo} alt={t.name} width={64} height={64} className="rounded-full object-cover w-16 h-16 flex-shrink-0" />
                <div>
                  <div className="flex gap-0.5 mb-3">{[1,2,3,4,5].map((s) => <span key={s} className="text-amber-400 text-sm">★</span>)}</div>
                  <p className="text-slate-700 leading-relaxed mb-3">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                    <span className="text-slate-400">·</span>
                    <p className="text-slate-500 text-sm">{t.program}</p>
                    <span className="text-brand-green-700 font-bold text-xs bg-brand-green-50 px-2 py-0.5 rounded-full">{t.salary}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── EMPLOYER / AGENCY STRIP ── */}
      <div className="bg-slate-50 border-t border-slate-200 py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">For Employers &amp; Agencies</p>
            <p className="text-slate-700 text-sm max-w-md">Pre-screened graduates, WOTC credits, OJT reimbursement, and WIOA compliance reporting — all in one place.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link href="/employer" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-5 py-2.5 rounded-lg transition-colors text-sm">Employer Portal</Link>
            <Link href="/workforce-board" className="border border-slate-300 text-slate-700 font-semibold px-5 py-2.5 rounded-lg hover:bg-white transition-colors text-sm">Workforce Board</Link>
          </div>
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div className="bg-slate-900 border-t border-slate-800 py-20 sm:py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <BlurIn>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to start?</h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed max-w-xl mx-auto">
              Apply online in minutes. Training may be fully funded. Graduate with a nationally recognized credential and a job offer.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/start" className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-4 rounded-lg font-bold text-lg transition-colors">
                Start Here — It&apos;s Free
              </Link>
              <Link href="/programs" className="border border-slate-600 text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-slate-800 transition-colors">
                View Programs
              </Link>
            </div>
          </BlurIn>
        </div>
      </div>

    </main>
  );
}
