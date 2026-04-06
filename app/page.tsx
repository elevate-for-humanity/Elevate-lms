
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import MarqueeBanner from '@/components/MarqueeBanner';
import { BlurIn } from '@/components/animations/PremiumAnimations';
import { ProgramVideoCards } from '@/components/marketing/ProgramVideoCards';

import HomeClientShell from './HomeClientShell';

export const dynamic = 'force-static';
export const revalidate = 60;

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
      <section className="flex flex-col lg:grid lg:grid-cols-2 gap-0">
        <div className="grid grid-cols-3 grid-rows-2 h-64 sm:h-80 lg:h-auto lg:min-h-[560px]">
          {[
            { src: '/images/pages/cna-hero.jpg',               alt: 'CNA Training' },
            { src: '/images/pages/hvac-hero.jpg',              alt: 'HVAC Training' },
            { src: '/images/pages/barber-hero-main.jpg',       alt: 'Barber Apprenticeship' },
            { src: '/images/pages/cdl-hero.jpg',               alt: 'CDL Training' },
            { src: '/images/pages/medical-assistant-hero.jpg', alt: 'Medical Assistant' },
            { src: '/images/pages/programs-hero-vibrant.jpg',  alt: 'Workforce Training' },
          ].map((img) => (
            <div key={img.src} className="relative overflow-hidden">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 33vw, 17vw"
              />
            </div>
          ))}
        </div>
        <div className="bg-slate-700 flex items-center">
          <div className="px-5 py-10 sm:px-8 sm:py-12 lg:px-14 lg:py-16 w-full">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-5 break-words">
              Get Certified.<br />Get Funded.<br />Get Hired — In Weeks.
            </h1>
            <p className="text-white text-sm sm:text-base leading-relaxed mb-6">
              Free and low-cost career training programs in Indiana. Earn industry-recognized certifications and start working fast.
            </p>
            {/* Proof bullets */}
            <ul className="space-y-2 mb-8">
              {[
                'Many students pay $0 — WIOA & Workforce Ready Grant available',
                'Industry-recognized certifications included',
                'Job placement support',
                'DOL Registered Apprenticeship Sponsor · ETPL listed',
              ].map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-white">
                  <span className="text-brand-red-400 font-bold flex-shrink-0">✔</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <Link href="/funding" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3.5 rounded-lg transition-colors text-sm sm:text-base text-center">
                Check My Eligibility
              </Link>
              <Link href="/licensing-partnerships" className="border-2 border-white text-white font-bold px-6 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm sm:text-base text-center">
                License the Platform
              </Link>
            </div>
            {/* Audience routing */}
            <p className="mt-5 text-white text-sm">
              Not a student?{' '}
              <Link href="/partnerships" className="text-white underline underline-offset-2 hover:text-brand-red-300 transition-colors">Partner with us</Link>
              {' '}·{' '}
              <Link href="/program-holder/dashboard" className="text-white underline underline-offset-2 hover:text-brand-red-300 transition-colors">Program Holder</Link>
            </p>
            {/* Phone */}
            <p className="mt-3 text-white text-sm">
              Questions? Call or text{' '}
              <a href="tel:3173143757" className="text-white font-bold underline hover:text-brand-red-300 transition-colors">(317) 314-3757</a>
            </p>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <MarqueeBanner />

      {/* ── FUNDING — near top, very prominent ── */}
      <section className="bg-brand-red-700 py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="w-full lg:max-w-2xl">
              <p className="text-white font-bold text-xs uppercase tracking-widest mb-3">Funding</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">You May Qualify for Free Training</h2>
              <p className="text-white text-sm sm:text-base leading-relaxed mb-6">
                Many students pay $0 through state and workforce funding programs. We help you find and apply for the funding you qualify for.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                {[
                  { label: 'WIOA', tag: 'Federal', desc: 'For adults, dislocated workers, and youth 16–24.' },
                  { label: 'Workforce Ready Grant', tag: 'Indiana State', desc: 'Covers high-demand certification programs.' },
                  { label: 'Job Ready Indy', tag: 'Indiana State', desc: 'For justice-involved individuals and employer OJT.' },
                ].map((f) => (
                  <div key={f.label} className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-1">{f.tag}</p>
                    <h3 className="text-slate-900 font-bold text-sm mb-1">{f.label}</h3>
                    <p className="text-black text-xs leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
              <Link href="/check-eligibility" className="inline-block bg-white text-brand-red-700 font-bold px-6 sm:px-8 py-3.5 rounded-lg hover:bg-brand-red-50 transition-colors text-sm sm:text-base">
                Check My Eligibility
              </Link>
            </div>
            <div className="lg:flex-shrink-0 bg-white rounded-2xl p-8 text-center lg:w-64 shadow-sm">
              <p className="text-5xl font-black text-brand-red-600 mb-2">$0</p>
              <p className="text-slate-800 text-sm font-semibold mb-4">Cost to eligible participants</p>
              <p className="text-black text-xs leading-relaxed">Federal and Indiana state funding covers tuition, books, tools, and exam fees.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-slate-800 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3 text-center">Simple process</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 text-center">Simple. Fast. Built for Real Jobs.</h2>
          <p className="text-white text-sm text-center mb-12 max-w-lg mx-auto">From application to employment — we guide you every step of the way.</p>
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
                {i < 3 && <div className="hidden sm:block absolute top-7 left-[calc(50%+28px)] right-[calc(-50%+28px)] h-px bg-white/30" />}
                <p className="text-white font-bold text-base mb-2">{s.label}</p>
                <p className="text-white text-sm leading-relaxed">{s.desc}</p>
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

      {/* ── PROGRAMS — video hero cards ── */}
      <section className="bg-slate-900 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3 text-center">Programs</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 text-center">Career Programs That Lead to Jobs</h2>
          <p className="text-white text-sm text-center mb-12 max-w-xl mx-auto">Every program ends with a nationally recognized credential and a clear path to employment.</p>
          <ProgramVideoCards />
          <div className="text-center">
            <Link href="/programs" className="border-2 border-white text-white hover:bg-white/10 font-bold px-8 py-3.5 rounded-lg transition-colors text-sm inline-block">
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
                  <p className="text-black text-sm leading-relaxed">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CREDIBILITY ── */}
      <section className="bg-slate-50 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-black mb-8 text-center">Approved &amp; recognized by</p>
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
                  <p className="text-black leading-relaxed mb-3">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-bold text-black text-sm">{t.name}</p>
                    <span className="text-black">·</span>
                    <p className="text-black text-sm">{t.program}</p>
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
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Find Out If You Qualify — Free</h2>
            <p className="text-white text-lg mb-8 leading-relaxed max-w-xl mx-auto">
              Many students pay $0 through WIOA, Workforce Ready Grant, or Job Ready Indy. Check your eligibility in 2 minutes.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <Link href="/check-eligibility" className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-4 rounded-lg font-bold text-lg transition-colors">
                Check My Eligibility
              </Link>
              <Link href="/programs" className="border-2 border-white text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition-colors">
                Explore Programs
              </Link>
            </div>
            <p className="text-white text-sm">
              Or call / text us directly:{' '}
              <a href="tel:3173143757" className="text-white font-bold underline hover:text-brand-red-300 transition-colors">(317) 314-3757</a>
            </p>
          </BlurIn>
        </div>
      </div>

    </main>
  );
}
