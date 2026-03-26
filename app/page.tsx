
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import MarqueeBanner from '@/components/MarqueeBanner';
import { BlurIn } from '@/components/animations/PremiumAnimations';

export const dynamic = 'force-static';
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Elevate for Humanity | Workforce Training — Indianapolis, Indiana',
  description: 'Free and low-cost career training in Indiana. WIOA, Workforce Ready Grant, and JRI funded programs. CNA, HVAC, CDL, IT, Barber. Apply today.',
  keywords: 'workforce training Indianapolis, WIOA training Indiana, CNA certification Indianapolis, CDL training Indiana, barber apprenticeship Indianapolis, HVAC training Indiana, free job training Indianapolis, Elevate for Humanity',
  openGraph: {
    title: 'Elevate for Humanity | Workforce Training — Indianapolis, Indiana',
    description: 'Free and low-cost career training in Indiana. Earn industry-recognized certifications and start working fast.',
    url: 'https://www.elevateforhumanity.org',
    siteName: 'Elevate for Humanity',
    locale: 'en_US',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <section className="grid lg:grid-cols-2">
        <div className="relative h-72 sm:h-96 lg:h-auto min-h-[560px] overflow-hidden bg-slate-900">
          <video src="/videos/barber-hero.mp4"
            poster="/hero-images/barber-hero.jpg"
            autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/30" />
        </div>
        <div className="bg-slate-900 flex items-center">
          <div className="px-8 py-12 lg:px-14 lg:py-16 max-w-xl w-full">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-4">Indianapolis, Indiana</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-5">
              Get Certified.<br />Get Funded.<br />Get Hired — In Weeks.
            </h1>
            <p className="text-slate-300 text-base leading-relaxed mb-6">
              Free and low-cost career training programs in Indiana. Earn industry-recognized certifications and start working fast.
            </p>
            {/* Proof bullets */}
            <ul className="space-y-2 mb-8">
              {[
                '100% funded programs available (WIOA, WRG, JRI)',
                'Certifications included',
                'Job placement support',
                'Indiana-approved training provider',
              ].map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-slate-200">
                  <span className="text-brand-red-400 font-bold flex-shrink-0">✔</span> {b}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href="/apply/start" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-base">
                Start My Application
              </Link>
              <Link href="/check-eligibility" className="border-2 border-white/30 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-base">
                Check If I Qualify
              </Link>
            </div>
            {/* Phone */}
            <p className="mt-6 text-slate-400 text-sm">
              Questions? Call or text{' '}
              <a href="tel:3173143757" className="text-white font-bold hover:text-brand-red-300 transition-colors">(317) 314-3757</a>
            </p>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <MarqueeBanner />

      {/* ── FUNDING — near top, very prominent ── */}
      <section className="bg-brand-red-700 py-14 sm:py-18 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl">
              <p className="text-brand-red-200 font-bold text-xs uppercase tracking-widest mb-3">Funding</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">You May Qualify for Free Training</h2>
              <p className="text-brand-red-100 text-base leading-relaxed mb-6">
                Many students pay $0 through state and workforce funding programs. We help you find and apply for the funding you qualify for.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mb-8">
                {[
                  { label: 'WIOA', tag: 'Federal', desc: 'For adults, dislocated workers, and youth 16–24.' },
                  { label: 'Workforce Ready Grant', tag: 'Indiana State', desc: 'Covers high-demand certification programs.' },
                  { label: 'JRI / Employer-Sponsored', tag: 'Indiana State', desc: 'For justice-involved individuals and employer OJT.' },
                ].map((f) => (
                  <div key={f.label} className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                    <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-1">{f.tag}</p>
                    <h3 className="text-white font-bold text-sm mb-1">{f.label}</h3>
                    <p className="text-slate-300 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
              <Link href="/check-eligibility" className="inline-block bg-white text-brand-red-700 font-bold px-8 py-3.5 rounded-lg hover:bg-brand-red-50 transition-colors">
                Check My Eligibility
              </Link>
            </div>
            <div className="lg:flex-shrink-0 bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center lg:w-64">
              <p className="text-5xl font-black text-white mb-2">$0</p>
              <p className="text-slate-300 text-sm font-semibold mb-4">Cost to eligible participants</p>
              <p className="text-slate-400 text-xs leading-relaxed">Federal and Indiana state funding covers tuition, books, tools, and exam fees.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-slate-950 py-16 sm:py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3 text-center">Simple process</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 text-center">Simple. Fast. Built for Real Jobs.</h2>
          <p className="text-slate-400 text-sm text-center mb-12 max-w-lg mx-auto">From application to employment — we guide you every step of the way.</p>
          <div className="grid sm:grid-cols-4 gap-6">
            {[
              { step: '1', label: 'Apply', desc: 'Tell us your goals and background. Takes 5 minutes.' },
              { step: '2', label: 'Get Approved', desc: 'We match you with funding and the right program.' },
              { step: '3', label: 'Train + Get Certified', desc: 'Complete training in weeks — not years.' },
              { step: '4', label: 'Get Placed', desc: 'We connect you with employers hiring now.' },
            ].map((s, i) => (
              <div key={s.step} className="flex flex-col items-center text-center relative">
                <div className="w-14 h-14 rounded-full bg-brand-red-600 text-white font-black text-xl flex items-center justify-center mb-4 flex-shrink-0">
                  {s.step}
                </div>
                {i < 3 && <div className="hidden sm:block absolute top-7 left-[calc(50%+28px)] right-[calc(-50%+28px)] h-px bg-slate-700" />}
                <p className="text-white font-bold text-base mb-2">{s.label}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/apply/start" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-10 py-4 rounded-lg transition-colors text-base inline-block">
              Start My Application
            </Link>
          </div>
        </div>
      </section>

      {/* ── PROGRAMS — video hero cards ── */}
      <section className="bg-slate-950 py-16 sm:py-20 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3 text-center">Programs</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 text-center">Career Programs That Lead to Jobs</h2>
          <p className="text-slate-400 text-sm text-center mb-12 max-w-xl mx-auto">Every program ends with a nationally recognized credential and a clear path to employment.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { tag: 'Healthcare', full: 'Certified Nursing Assistant', duration: '4–8 weeks', salary: '$28–$42K/yr', video: '/videos/cna-hero.mp4', href: '/programs/cna' },
              { tag: 'Skilled Trades', full: 'HVAC Technician', duration: '12 weeks', salary: '$40–$80K/yr', video: '/videos/hvac-hero-final.mp4', href: '/programs/hvac-technician' },
              { tag: 'Transportation', full: 'CDL Class A', duration: 'Weeks, not years', salary: '$50–$80K/yr', video: '/videos/cdl-hero.mp4', href: '/programs/cdl-training' },
              { tag: 'Apprenticeship', full: 'Barber Apprenticeship', duration: '15–17 months', salary: '$35–$65K+/yr', video: '/videos/barber-training.mp4', href: '/programs/barber-apprenticeship' },
            ].map((prog) => (
              <Link key={prog.full} href={prog.href} className="group relative rounded-2xl overflow-hidden block" style={{ aspectRatio: '9/14' }}>
                {/* Video background */}
                <video
                  src={prog.video}
                  autoPlay muted loop playsInline
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-1">{prog.tag}</p>
                  <h3 className="font-extrabold text-white text-base leading-snug mb-3">{prog.full}</h3>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-300">⏱ {prog.duration}</p>
                    <p className="text-sm font-bold text-green-400">💰 {prog.salary}</p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors">
                    View Program →
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center">
            <Link href="/programs" className="border-2 border-white/20 text-white hover:bg-white/10 font-bold px-8 py-3.5 rounded-lg transition-colors text-sm inline-block">
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY ELEVATE ── */}
      <section className="bg-slate-50 border-t border-slate-200 py-16 sm:py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-3 text-center">Why us</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-12 text-center">Why Students Choose Elevate</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '⚡', title: 'Fast-Track Programs', desc: '4–16 weeks to a new career. No years of school required.' },
              { icon: '🏆', title: 'Real Certifications', desc: 'Industry-recognized credentials employers actually hire for.' },
              { icon: '🔧', title: 'Hands-On Training', desc: 'Job-ready skills from day one — not just classroom theory.' },
              { icon: '🤝', title: 'Enrollment to Employment', desc: 'We support you from application through job placement.' },
            ].map((w) => (
              <div key={w.title} className="bg-white border border-slate-200 rounded-xl p-6 text-center">
                <span className="text-3xl block mb-3">{w.icon}</span>
                <h3 className="font-extrabold text-slate-900 text-base mb-2">{w.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CREDIBILITY ── */}
      <section className="bg-white border-t border-slate-100 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8 text-center">Approved &amp; recognized by</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { title: 'DOL Registered Apprenticeship', icon: '🏛️', bg: 'bg-blue-600', text: 'text-white' },
              { title: 'Indiana ETPL Certified', icon: '📋', bg: 'bg-brand-red-600', text: 'text-white' },
              { title: 'Government Contractor', icon: '📜', bg: 'bg-slate-800', text: 'text-white' },
              { title: 'Certiport Testing Center', icon: '💻', bg: 'bg-violet-600', text: 'text-white' },
              { title: 'IRS VITA Certified', icon: '💼', bg: 'bg-emerald-600', text: 'text-white' },
              { title: 'EmployIndy Partner', icon: '🤝', bg: 'bg-amber-500', text: 'text-white' },
            ].map((c) => (
              <div key={c.title} className={`flex items-center gap-2.5 ${c.bg} ${c.text} px-5 py-3 rounded-full font-semibold text-sm whitespace-nowrap shadow-sm`}>
                <span className="text-lg leading-none">{c.icon}</span>
                {c.title}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-slate-50 border-t border-slate-200 py-16 sm:py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3 text-center">Student Outcomes</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-10 text-center">Real students. Real results.</h2>
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
      </section>

      {/* ── FINAL CTA ── */}
      <div className="bg-slate-900 border-t border-slate-800 py-20 sm:py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <BlurIn>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to Start Your Career?</h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed max-w-xl mx-auto">
              Apply in 5 minutes. Training may be fully funded. Graduate with a nationally recognized credential and a job offer.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <Link href="/apply/start" className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-4 rounded-lg font-bold text-lg transition-colors">
                Apply Now
              </Link>
              <a href="tel:3173143757" className="border-2 border-white/30 text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition-colors">
                Talk to an Advisor
              </a>
            </div>
            <p className="text-slate-400 text-sm">
              Or call / text us directly:{' '}
              <a href="tel:3173143757" className="text-white font-bold hover:text-brand-red-300 transition-colors">(317) 314-3757</a>
            </p>
          </BlurIn>
        </div>
      </div>

    </main>
  );
}
