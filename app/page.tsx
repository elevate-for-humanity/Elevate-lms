
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import MarqueeBanner from '@/components/MarqueeBanner';
import { BlurIn } from '@/components/animations/PremiumAnimations';
import { ProgramVideoCards } from '@/components/marketing/ProgramVideoCards';
import { HeroVideoBg } from '@/components/marketing/HeroVideoBg';
import HomeClientShell from './HomeClientShell';

export const dynamic = 'force-static';
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Elevate for Humanity | Workforce Training — Indianapolis, Indiana',
  description: 'Career training in Indiana. WIOA and Workforce Ready Grant funded programs include HVAC, CDL, and IT. CNA and Barber Apprenticeship also available. Apply today.',
  keywords: 'workforce training Indianapolis, WIOA training Indiana, CNA certification Indianapolis, CDL training Indiana, barber apprenticeship Indianapolis, HVAC training Indiana, career training Indianapolis, Elevate for Humanity',
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
      <section className="grid lg:grid-cols-2 gap-0">
        <div className="relative h-72 sm:h-96 lg:h-auto min-h-[560px] overflow-hidden bg-slate-700">
          <HeroVideoBg
            src="/videos/homepage-hero-new.mp4"
            audioSrc="/videos/homepage-hero-new.mp3"
          />
        </div>
        <div className="bg-slate-700 flex items-center">
          <div className="px-8 py-12 lg:px-14 lg:py-16 max-w-xl w-full">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-5">
              Get Certified.<br />Get Funded.<br />Get Hired — In Weeks.
            </h1>
            <p className="text-slate-200 text-base leading-relaxed mb-2">
              Most applicants qualify for $0 training. Check your eligibility in 2 minutes.
            </p>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              If you don&apos;t qualify for full funding, we&apos;ll walk you through grants, payment plans, or employer-sponsored options — so you can still enroll.
            </p>
            {/* Proof bullets */}
            <ul className="space-y-2 mb-8">
              {[
                'We secure funding for most participants — WIOA, Workforce Ready Grant, JRI',
                'Industry-recognized certifications included',
                'Job placement support from day one',
                'DOL Registered Apprenticeship Sponsor · ETPL listed',
              ].map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-slate-200">
                  <span className="text-brand-red-400 font-bold flex-shrink-0">✔</span> {b}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href="/funding" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-base">
                Check My Eligibility
              </Link>
              <Link href="/programs" className="border-2 border-white/30 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-base">
                Explore Programs
              </Link>
            </div>
            {/* Audience routing */}
            <p className="mt-5 text-slate-400 text-sm">
              Employer or partner?{' '}
              <Link href="/partnerships" className="text-slate-300 underline underline-offset-2 hover:text-white transition-colors">Work with us</Link>
            </p>
            {/* Phone */}
            <p className="mt-3 text-slate-400 text-sm">
              Questions? Call or text{' '}
              <a href="tel:3173143757" className="text-white font-bold hover:text-brand-red-300 transition-colors">(317) 314-3757</a>
            </p>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <MarqueeBanner />

      {/* ── FUNDING — near top, very prominent ── */}
      <section className="bg-brand-red-700 py-14 sm:py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl">
              <p className="text-white font-bold text-xs uppercase tracking-widest mb-3">Funding</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">We Secure Funding for Most Participants</h2>
              <p className="text-brand-red-100 text-base leading-relaxed mb-2">
                Most applicants qualify for $0 — federal and Indiana state programs cover tuition, books, tools, and exam fees.
              </p>
              <p className="text-brand-red-200 text-sm leading-relaxed mb-6">
                If you don&apos;t qualify for full coverage, we provide alternative funding and payment options so you can still enroll.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mb-8">
                {[
                  { label: 'WIOA', tag: '① Full funding', desc: 'Federal program for adults, dislocated workers, and youth 16–24. Covers everything.', highlight: true },
                  { label: 'Workforce Ready Grant', tag: '① Full funding', desc: 'Indiana state grant for high-demand certifications. Covers everything.', highlight: true },
                  { label: 'Partial funding + payment options', tag: '② If you don\'t fully qualify', desc: 'JRI, employer-sponsored OJT, payment plans, and BNPL — no one is left without a path.', highlight: false },
                ].map((f) => (
                  <div key={f.label} className={`rounded-xl p-4 shadow-sm ${f.highlight ? 'bg-white' : 'bg-brand-red-800 border border-brand-red-600'}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${f.highlight ? 'text-brand-red-600' : 'text-brand-red-300'}`}>{f.tag}</p>
                    <h3 className={`font-bold text-sm mb-1 ${f.highlight ? 'text-slate-900' : 'text-white'}`}>{f.label}</h3>
                    <p className={`text-xs leading-relaxed ${f.highlight ? 'text-slate-600' : 'text-brand-red-200'}`}>{f.desc}</p>
                  </div>
                ))}
              </div>
              <Link href="/check-eligibility" className="inline-block bg-white text-brand-red-700 font-bold px-8 py-3.5 rounded-lg hover:bg-brand-red-50 transition-colors">
                Check My Eligibility
              </Link>
            </div>
            <div className="lg:flex-shrink-0 bg-white rounded-2xl p-8 text-center lg:w-64 shadow-sm">
              <p className="text-5xl font-black text-brand-red-600 mb-2">$0</p>
              <p className="text-slate-800 text-sm font-semibold mb-4">for most participants</p>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">Tuition, books, tools, and exam fees — fully covered through WIOA or Workforce Ready Grant.</p>
              <p className="text-slate-400 text-xs">Don&apos;t qualify? We still have a path for you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-slate-800 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3 text-center">Simple process</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 text-center">Simple. Fast. Built for Real Jobs.</h2>
          <p className="text-slate-400 text-sm text-center mb-12 max-w-lg mx-auto">From application to employment — we guide you every step of the way.</p>
          <div className="grid sm:grid-cols-4 gap-6">
            {[
              { step: '1', label: 'Check Eligibility', desc: 'Find out which funding programs you qualify for. Takes 2 minutes.' },
              { step: '2', label: 'Get Matched', desc: 'We match you with the right program and funding source.' },
              { step: '3', label: 'Train + Get Certified', desc: 'Complete training in weeks — not years.' },
              { step: '4', label: 'Get Placed', desc: 'We connect you with employers hiring now.' },
            ].map((s, i) => (
              <div key={s.step} className="flex flex-col items-center text-center relative">
                <div className="w-14 h-14 rounded-full bg-brand-red-600 text-white font-black text-xl flex items-center justify-center mb-4 flex-shrink-0">
                  {s.step}
                </div>
                {i < 3 && <div className="hidden sm:block absolute top-7 left-[calc(50%+28px)] right-[calc(-50%+28px)] h-px bg-slate-600" />}
                <p className="text-white font-bold text-base mb-2">{s.label}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/check-eligibility" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-10 py-4 rounded-lg transition-colors text-base inline-block">
              Check My Eligibility
            </Link>
          </div>
        </div>
      </section>

      {/* ── EMPLOYER PROOF ── */}
      <section className="bg-white border-t border-slate-100 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 text-center">Graduates hired by</p>
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-6">
            {[
              'IU Health',
              'Eskenazi Health',
              'Community Health Network',
              'Ryder Logistics',
              'Amazon',
              'Republic Services',
              'Goodwill Industries',
              'EmployIndy Partners',
            ].map((name) => (
              <span key={name} className="text-slate-400 font-semibold text-sm tracking-wide">{name}</span>
            ))}
          </div>
          <p className="text-center mt-6 text-xs text-slate-400">
            Job placement support included in every program.{' '}
            <Link href="/partnerships" className="text-brand-red-600 hover:underline font-medium">Hire our graduates →</Link>
          </p>
        </div>
      </section>

      {/* ── PROGRAMS — video hero cards ── */}
      <section className="bg-slate-900 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3 text-center">Programs</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 text-center">Career Programs That Lead to Jobs</h2>
          <p className="text-slate-400 text-sm text-center mb-12 max-w-xl mx-auto">Every program ends with a nationally recognized credential and a clear path to employment.</p>
          <ProgramVideoCards />
          <div className="text-center">
            <Link href="/programs" className="border-2 border-white/20 text-white hover:bg-white/10 font-bold px-8 py-3.5 rounded-lg transition-colors text-sm inline-block">
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY ELEVATE ── */}
      <section className="bg-slate-50 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-3 text-center">Why us</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-12 text-center">Why Students Choose Elevate</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { img: '/images/pages/about-career-training.jpg', title: 'Fast-Track Programs', desc: '4–16 weeks to a new career. No years of school required.' },
              { img: '/images/pages/admin-certifications-hero.jpg', title: 'Real Certifications', desc: 'Industry-recognized credentials employers actually hire for.' },
              { img: '/images/pages/barber-apprentice-learning.jpg', title: 'Hands-On Training', desc: 'Job-ready skills from day one — not just classroom theory.' },
              { img: '/images/pages/about-employer-partners.jpg', title: 'Enrollment to Employment', desc: 'We support you from application through job placement.' },
            ].map((w) => (
              <div key={w.title} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="relative h-36 w-full">
                  <Image src={w.img} alt={w.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 25vw" />
                </div>
                <div className="p-5">
                  <h3 className="font-extrabold text-slate-900 text-base mb-2">{w.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CREDIBILITY ── */}
      <section className="bg-slate-50 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-8 text-center">Approved &amp; recognized by</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { title: 'DOL Registered Apprenticeship', bg: 'bg-blue-600' },
              { title: 'Indiana ETPL Certified', bg: 'bg-brand-red-600' },
              { title: 'Government Contractor', bg: 'bg-slate-800' },
              { title: 'Certiport Testing Center', bg: 'bg-violet-600' },
              { title: 'IRS VITA Certified', bg: 'bg-emerald-700' },
              { title: 'EmployIndy Partner', bg: 'bg-amber-700' },
            ].map((c) => (
              <div key={c.title} className={`${c.bg} text-white px-5 py-3 rounded-full font-semibold text-sm whitespace-nowrap shadow-sm`}>
                {c.title}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-white border-t border-slate-100 py-16 px-6">
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

      {/* ── SOCIAL + NEWSLETTER ── */}
      <HomeClientShell />

      {/* ── FINAL CTA ── */}
      <div className="bg-slate-700 border-t border-slate-600 py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <BlurIn>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Most Applicants Qualify for $0 Training</h2>
            <p className="text-slate-300 text-lg mb-3 leading-relaxed max-w-xl mx-auto">
              Check your eligibility in 2 minutes. If you qualify for WIOA or Workforce Ready Grant, your training is fully covered.
            </p>
            <p className="text-slate-400 text-sm mb-8 max-w-lg mx-auto">
              If you don&apos;t qualify for full funding, we&apos;ll walk you through every alternative — grants, payment plans, and employer-sponsored options.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <Link href="/check-eligibility" className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-4 rounded-lg font-bold text-lg transition-colors">
                Check My Eligibility
              </Link>
              <Link href="/programs" className="border-2 border-white/30 text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition-colors">
                Explore Programs
              </Link>
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
