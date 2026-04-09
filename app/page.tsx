
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import MarqueeBanner from '@/components/MarqueeBanner';
import { BlurIn } from '@/components/animations/PremiumAnimations';
import { ProgramVideoCards } from '@/components/marketing/ProgramVideoCards';
import { HeroVideoBg } from '@/components/marketing/HeroVideoBg';
import HomeClientShell from './HomeClientShell';

export const dynamic = 'force-static';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Elevate for Humanity | Workforce Training — Indianapolis, Indiana',
  description: 'Elevate for Humanity connects individuals to funded training programs, industry-recognized credentials, and real employment opportunities through a structured workforce pipeline. No upfront cost for eligible participants.',
  keywords: 'workforce training Indianapolis, WIOA training Indiana, CNA certification Indianapolis, CDL training Indiana, barber apprenticeship Indianapolis, HVAC training Indiana, career training Indianapolis, Elevate for Humanity',
  openGraph: {
    title: 'Elevate for Humanity | Workforce Training — Indianapolis, Indiana',
    description: 'Funded training programs, industry-recognized credentials, and real employment opportunities through a structured workforce pipeline.',
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
        <div className="relative h-64 sm:h-80 lg:h-auto lg:min-h-[560px] overflow-hidden bg-slate-700">
          <HeroVideoBg
            src="/videos/homepage-hero-new.mp4"
            poster="/images/pages/comp-home-hero-programs.jpg"
            audioSrc="/audio/heroes/cna.mp3"
          />
        </div>
        <div className="bg-slate-700 flex items-center">
          <div className="px-5 py-10 sm:px-8 sm:py-12 lg:px-14 lg:py-16 w-full">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-5 break-words">
              Workforce Training.<br />Certification Pathways.<br />Career Placement.
            </h1>
            <p className="text-white text-sm sm:text-base leading-relaxed mb-2">
              Elevate for Humanity connects individuals to funded training programs, industry-recognized credentials, and real employment opportunities through a structured workforce pipeline.
            </p>
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              No upfront cost for eligible participants. Training is only part of the solution — we also help participants navigate funding, transportation-related barriers, and supportive services that make completion possible.
            </p>
            <ul className="space-y-2 mb-8">
              {[
                'Funding navigation through WIOA and workforce programs',
                'Structured, outcome-driven training pathways',
                'Certification application and exam preparation support',
                'DOL Registered Apprenticeship Sponsor · ETPL listed',
                'Help navigating transportation, barrier-removal, and supportive services when available',
              ].map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-white">
                  <span className="text-brand-red-400 font-bold flex-shrink-0">✔</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <Link href="/apply" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3.5 rounded-lg transition-colors text-sm sm:text-base text-center">
                Check Eligibility &amp; Apply
              </Link>
              <Link href="/partnerships" className="border-2 border-white text-white font-bold px-6 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm sm:text-base text-center">
                Partner With Us
              </Link>
            </div>
            <p className="mt-5 text-white/70 text-sm">
              Questions? Call or text{' '}
              <a href="tel:3173143757" className="text-white font-bold underline hover:text-brand-red-300 transition-colors">(317) 314-3757</a>
            </p>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <MarqueeBanner />

      {/* ── HOW IT WORKS ── */}
      <section className="bg-slate-800 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3 text-center">How Elevate Works</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 text-center">Get Funded. Get Trained. Get Tested. Get Hired.</h2>
          <p className="text-white/70 text-sm text-center mb-12 max-w-2xl mx-auto">
            Elevate for Humanity is a workforce training institute that helps learners access funding, earn industry credentials through training and proctored testing, and connect to employment.
          </p>
          <div className="grid sm:grid-cols-4 gap-8">
            {[
              { step: '1', label: 'Get Funded', desc: 'We help you access WIOA, Workforce Ready Grant, and other funding so training costs nothing out of pocket for eligible participants.', href: '/funding' },
              { step: '2', label: 'Get Trained', desc: 'Complete structured, employer-aligned training in healthcare, trades, IT, or business — delivered by Elevate or approved partner providers.', href: '/programs' },
              { step: '3', label: 'Get Tested', desc: 'Take your certification exam at our authorized testing center. We proctor EPA 608, NHA, Certiport, ACT WorkKeys, and NRF credentials on-site.', href: '/testing' },
              { step: '4', label: 'Get Hired', desc: 'We connect graduates to employer partners and workforce agencies. Placement support is built into every program.', href: '/employers' },
            ].map((s, i) => (
              <div key={s.step} className="flex flex-col items-center text-center relative">
                <div className="w-14 h-14 rounded-full bg-brand-red-600 text-white font-black text-xl flex items-center justify-center mb-4 flex-shrink-0 z-10">
                  {s.step}
                </div>
                {i < 3 && (
                  <div className="hidden sm:block absolute top-7 left-[calc(50%+28px)] right-[calc(-50%+28px)] h-px bg-white/20" />
                )}
                <p className="text-white font-bold text-sm mb-2">{s.label}</p>
                <p className="text-white/60 text-xs leading-relaxed">{s.desc}</p>
                <Link href={s.href} className="mt-3 text-brand-red-400 hover:text-brand-red-300 text-xs font-semibold transition-colors">
                  Learn more →
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/apply" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-10 py-4 rounded-lg transition-colors text-base inline-block">
              Apply for Training
            </Link>
          </div>
        </div>
      </section>

      {/* ── PROGRAMS ── */}
      <section className="bg-slate-900 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3 text-center">Programs</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 text-center">Career-Focused Training Programs</h2>
          <p className="text-white/70 text-sm text-center mb-8 max-w-xl mx-auto">
            Structured programs designed for real-world skill development, licensure readiness, and employment outcomes.
          </p>

          {/* Category pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {[
              { label: 'Healthcare & Recovery', sub: 'Peer Recovery Support · CNA' },
              { label: 'Skilled Trades', sub: 'HVAC · CDL' },
              { label: 'Barber & Beauty', sub: 'Apprenticeship · Licensing' },
            ].map((cat) => (
              <div key={cat.label} className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-center">
                <p className="text-white font-bold text-sm">{cat.label}</p>
                <p className="text-white/50 text-xs mt-0.5">{cat.sub}</p>
              </div>
            ))}
          </div>

          <ProgramVideoCards />

          <div className="text-center mt-10">
            <Link href="/programs" className="border-2 border-white text-white hover:bg-white/10 font-bold px-8 py-3.5 rounded-lg transition-colors text-sm inline-block">
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY ELEVATE ── */}
      <section className="bg-slate-50 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-3 text-center">Why Elevate</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 text-center">More Than Training — A Workforce System</h2>
          <p className="text-slate-500 text-sm text-center mb-12 max-w-2xl mx-auto">
            Elevate for Humanity is not just a training provider. We operate as a workforce pipeline, ensuring participants don&apos;t just start programs — they complete them and move into careers.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { img: '/images/pages/about-career-training.jpg',      title: 'Funding Navigation',         desc: 'WIOA and workforce program eligibility support from day one.' },
              { img: '/images/pages/admin-certifications-hero.jpg',  title: 'Outcome-Driven Pathways',    desc: 'Structured programs with clear timelines, milestones, and completion requirements.' },
              { img: '/images/pages/barber-apprentice-learning.jpg', title: 'Certification Preparation',  desc: 'Exam readiness support and credential application guidance included.' },
              { img: '/images/pages/about-employer-partners.jpg',    title: 'Employer Connections',       desc: 'Participants are connected to employer partners and workforce opportunities upon completion.' },
              { img: '/images/pages/about-career-training.jpg',      title: 'Supportive Services',        desc: 'We help eligible participants navigate barrier-removal support such as transportation assistance, work supplies, and other approved supportive services through workforce partners when available.' },
            ].map((w) => (
              <div key={w.title} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="relative h-36 w-full">
                  <Image src={w.img} alt={w.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 25vw" />
                </div>
                <div className="p-5">
                  <h3 className="font-extrabold text-slate-900 text-base mb-2">{w.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNDING ── */}
      <section className="bg-brand-red-700 py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="w-full lg:max-w-2xl">
              <p className="text-white font-bold text-xs uppercase tracking-widest mb-3">Funding</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">No Upfront Cost for Eligible Participants</h2>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-6">
                We help participants navigate funding through workforce programs and partner agencies. Many individuals qualify for full coverage of tuition, books, tools, and exam fees.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                {[
                  { label: 'WIOA',                  tag: 'Federal',        desc: 'For adults, dislocated workers, and youth 16–24.' },
                  { label: 'Workforce Ready Grant', tag: 'Indiana State',  desc: 'Covers high-demand certification programs.' },
                  { label: 'Job Ready Indy',        tag: 'Indiana State',  desc: 'For justice-involved individuals and employer OJT.' },
                ].map((f) => (
                  <div key={f.label} className="bg-white rounded-xl p-4 shadow-sm">
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
            <div className="lg:flex-shrink-0 bg-white rounded-2xl p-8 text-center lg:w-64 shadow-sm">
              <p className="text-5xl font-black text-brand-red-600 mb-2">$0</p>
              <p className="text-slate-800 text-sm font-semibold mb-4">Cost to eligible participants</p>
              <p className="text-slate-500 text-xs leading-relaxed">Federal and Indiana state funding covers tuition, books, tools, and exam fees.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── OUTCOMES ── */}
      <section className="bg-white border-t border-slate-100 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3 text-center">Outcomes</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 text-center">Building Workforce Impact</h2>
          <p className="text-slate-500 text-sm text-center leading-relaxed mb-10 max-w-2xl mx-auto">
            We are actively building a growing network across Indiana, connecting individuals to training, certification, and employment opportunities.
          </p>

          {/* Testimonials */}
          <div className="divide-y divide-slate-100">
            {[
              { quote: "WIOA paid for my Medical Assistant training, and I started working right after graduation. Now I'm making $42,000 a year with full benefits.", name: 'Sarah M.',    program: 'Medical Assistant', salary: '$42K/yr', photo: '/images/testimonials-hq/person-1.jpg' },
              { quote: "They provided an extremely informative and hospitable environment. I really enjoyed my classes. The staff made everything easy to understand.",  name: 'Timothy S.', program: 'CDL Training',       salary: '$55K/yr', photo: '/images/testimonials-hq/person-4.jpg' },
              { quote: "Anyone who wants to grow and make more money should try Elevate. You deserve it. The staff is amazing and easy to communicate with.",            name: 'Jasmine R.', program: 'CNA Certification',  salary: '$38K/yr', photo: '/images/testimonials-hq/person-3.jpg' },
            ].map((t) => (
              <div key={t.name} className="flex flex-col sm:flex-row gap-6 py-8">
                <Image src={t.photo} alt={t.name} width={64} height={64} className="rounded-full object-cover w-16 h-16 flex-shrink-0" />
                <div>
                  <div className="flex gap-0.5 mb-3">{[1,2,3,4,5].map((s) => <span key={s} className="text-amber-400 text-sm">★</span>)}</div>
                  <p className="text-slate-700 leading-relaxed mb-3">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                    <span className="text-slate-300">·</span>
                    <p className="text-slate-500 text-sm">{t.program}</p>
                    <span className="text-brand-green-700 font-bold text-xs bg-brand-green-50 px-2 py-0.5 rounded-full">{t.salary}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNERS ── */}
      <section className="bg-slate-50 border-t border-slate-200 py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 text-center">Workforce &amp; Community Partnerships</p>
          <p className="text-slate-500 text-sm text-center mb-8 max-w-2xl mx-auto">
            We collaborate with workforce agencies, employers, and training providers to deliver funded career pathways that lead to real outcomes.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { title: 'DOL Registered Apprenticeship', bg: 'bg-blue-600' },
              { title: 'Indiana ETPL Certified',        bg: 'bg-brand-red-600' },
              { title: 'Government Contractor',         bg: 'bg-slate-800' },
              { title: 'Certiport Testing Center',      bg: 'bg-violet-600' },
              { title: 'IRS VITA Certified',            bg: 'bg-emerald-700' },
              { title: 'EmployIndy Partner',            bg: 'bg-amber-700' },
            ].map((c) => (
              <div key={c.title} className={`${c.bg} text-white px-5 py-3 rounded-full font-semibold text-sm whitespace-nowrap shadow-sm`}>
                {c.title}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPLIANCE LINE ── */}
      <section className="bg-white border-t border-slate-100 py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-400 text-xs leading-relaxed">
            Programs are delivered directly by Elevate for Humanity or through approved training providers and are aligned with applicable credentialing body requirements.
          </p>
        </div>
      </section>

      {/* ── SOCIAL + NEWSLETTER ── */}
      <HomeClientShell />

      {/* ── FINAL CTA ── */}
      <div className="bg-slate-700 border-t border-slate-600 py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <BlurIn>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to Start?</h2>
            <p className="text-white/80 text-lg mb-8 leading-relaxed max-w-xl mx-auto">
              Apply for training or connect with our team to learn which programs and funding sources are available to you.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <Link href="/apply" className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-4 rounded-lg font-bold text-lg transition-colors">
                Check Eligibility &amp; Apply
              </Link>
              <Link href="/programs" className="border-2 border-white text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition-colors">
                Explore Programs
              </Link>
            </div>
            <p className="text-white/60 text-sm">
              Or call / text us directly:{' '}
              <a href="tel:3173143757" className="text-white font-bold underline hover:text-brand-red-300 transition-colors">(317) 314-3757</a>
            </p>
          </BlurIn>
        </div>
      </div>

    </main>
  );
}
