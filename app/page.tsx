
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
  title: 'Elevate for Humanity | Workforce Operating System — Indianapolis, Indiana',
  description: 'DOL-registered workforce infrastructure for government-funded training, apprenticeships, and employment pipelines. WIOA compliant. ETPL approved. Built for agencies, employers, and program holders.',
  keywords: 'workforce operating system Indianapolis, WIOA training Indiana, DOL registered apprenticeship, ETPL approved training provider, workforce development platform Indiana, Elevate for Humanity',
  openGraph: {
    title: 'Elevate for Humanity | Workforce Operating System',
    description: 'DOL-registered workforce infrastructure for government-funded training, apprenticeships, and employment pipelines.',
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
            audioSrc="/audio/heroes/programs.mp3"
          />
        </div>
        <div className="bg-slate-700 flex items-center">
          <div className="px-5 py-10 sm:px-8 sm:py-12 lg:px-14 lg:py-16 w-full">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">
              DOL Registered · ETPL Approved · WIOA Compliant
            </p>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-5 break-words">
              Workforce Operating System for Government-Funded Training and Apprenticeships.
            </h1>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-8">
              Elevate for Humanity is the infrastructure layer connecting workforce agencies, employers, and training providers to a single compliant pipeline — from funding authorization through credential issuance and employment placement.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <Link href="/for-agencies" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3.5 rounded-lg transition-colors text-sm text-center">
                For Workforce Agencies
              </Link>
              <Link href="/for-employers" className="border-2 border-white text-white font-bold px-6 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm text-center">
                For Employers
              </Link>
              <Link href="/program-holder" className="border-2 border-white/50 text-white/80 font-bold px-6 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm text-center">
                For Program Holders
              </Link>
              <Link href="/apply" className="border-2 border-white/50 text-white/80 font-bold px-6 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm text-center">
                For Learners
              </Link>
            </div>
            <p className="mt-5 text-white/60 text-xs">
              Questions? Call or text{' '}
              <a href="tel:3173143757" className="text-white/80 font-bold underline hover:text-brand-red-300 transition-colors">(317) 314-3757</a>
            </p>
          </div>
        </div>
      </section>

      {/* ── BUYER PATHS ── */}
      <section className="bg-white py-16 px-6 border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-500 mb-3 text-center">Who This Is Built For</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-10 text-center">One system. Four entry points.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: 'Workforce Agencies',
                icon: '🏛️',
                desc: 'WIOA case managers, WorkOne centers, and DWD partners. Refer participants directly into a RAPIDS-tracked, ETPL-approved pipeline.',
                cta: 'Agency Portal',
                href: '/for-agencies',
                accent: 'border-blue-500',
                ctaClass: 'bg-blue-600 hover:bg-blue-700',
              },
              {
                label: 'Employers',
                icon: '🏢',
                desc: 'Hire pre-credentialed graduates, sponsor apprentices, or co-design training programs aligned to your workforce needs.',
                cta: 'Employer Portal',
                href: '/for-employers',
                accent: 'border-green-500',
                ctaClass: 'bg-green-600 hover:bg-green-700',
              },
              {
                label: 'Program Holders',
                icon: '📋',
                desc: 'Training providers, schools, and instructors. Run your programs on Elevate infrastructure — compliance, enrollment, and credentialing included.',
                cta: 'Program Holder Portal',
                href: '/program-holder',
                accent: 'border-purple-500',
                ctaClass: 'bg-purple-600 hover:bg-purple-700',
              },
              {
                label: 'Learners',
                icon: '🎓',
                desc: 'Individuals seeking funded training, credentials, and employment. Check eligibility, apply, and track your progress through the full pipeline.',
                cta: 'Check Eligibility',
                href: '/apply',
                accent: 'border-brand-red-500',
                ctaClass: 'bg-brand-red-600 hover:bg-brand-red-700',
              },
            ].map((b) => (
              <div key={b.label} className={`bg-white border-t-4 ${b.accent} rounded-xl shadow-sm p-6 flex flex-col`}>
                <div className="text-3xl mb-3">{b.icon}</div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{b.label}</h3>
                <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-5">{b.desc}</p>
                <Link href={b.href} className={`${b.ctaClass} text-white text-sm font-bold px-4 py-2.5 rounded-lg text-center transition-colors`}>
                  {b.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <MarqueeBanner />

      {/* ── WHAT THE OS DOES ── */}
      <section className="bg-slate-800 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3 text-center">The Elevate Workforce OS</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 text-center">One system replacing four vendors.</h2>
          <p className="text-white/70 text-sm text-center mb-12 max-w-2xl mx-auto">
            Most organizations stitch together an LMS, a case management system, a compliance tracker, and a CRM. Elevate internalizes all of it into a single compliant pipeline.
          </p>
          <div className="grid sm:grid-cols-4 gap-8">
            {[
              { step: '1', label: 'Funding Authorization', desc: 'WIOA eligibility determination, WorkOne referral intake, WRG and IMPACT grant routing — all tracked and documented.', href: '/funding' },
              { step: '2', label: 'Training Delivery', desc: 'Blueprint-driven LMS with checkpoint gating, attendance tracking, RTI logs, and RAPIDS-compliant hour reporting.', href: '/programs' },
              { step: '3', label: 'Credential Issuance', desc: 'Authorized testing center for EPA 608, NHA, Certiport, ACT WorkKeys, and NRF. Exam funding authorized on completion.', href: '/testing' },
              { step: '4', label: 'Employment Pipeline', desc: 'OJT tracking, employer matching, placement verification, and post-placement follow-up — all in one record.', href: '/for-employers' },
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
        </div>
      </section>

      {/* ── FUNDING LOGIC ── */}
      <section className="bg-slate-900 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3 text-center">How Training Gets Paid For</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 text-center">Three funding paths. No ambiguity.</h2>
          <p className="text-white/70 text-sm text-center mb-10 max-w-xl mx-auto">
            Training cost depends on your funding path — not a flat price. Here is how it works.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                tier: 'Fully Funded',
                badge: 'WIOA / Government Grant',
                badgeColor: 'bg-green-500',
                cost: '$0 out of pocket',
                costColor: 'text-green-400',
                desc: 'Eligible participants referred through WorkOne, FSSA, or IMPACT receive full tuition coverage. Funding is authorized before training begins.',
                items: ['WIOA Title I Adult & Dislocated Worker', 'Workforce Ready Grant (WRG)', 'IMPACT / FSSA referral', 'JRI / reentry funding'],
                cta: 'Check Eligibility',
                href: '/apply',
              },
              {
                tier: 'Employer-Sponsored',
                badge: 'OJT / Apprenticeship',
                badgeColor: 'bg-blue-500',
                cost: 'Employer-covered',
                costColor: 'text-blue-400',
                desc: 'Employers sponsor participants through On-the-Job Training agreements or DOL Registered Apprenticeships. Wage reimbursement available.',
                items: ['OJT wage reimbursement up to 50%', 'DOL Registered Apprenticeship', 'Employer tuition sponsorship', 'Custom cohort training'],
                cta: 'Employer Info',
                href: '/for-employers',
              },
              {
                tier: 'Self-Pay',
                badge: 'Private Pay',
                badgeColor: 'bg-slate-500',
                cost: 'Program rate applies',
                costColor: 'text-slate-300',
                desc: 'Participants who do not qualify for grant funding or employer sponsorship may enroll at the published program rate. Payment plans available.',
                items: ['Published program tuition', 'Payment plans available', 'No hidden fees', 'Same credential outcomes'],
                cta: 'View Programs',
                href: '/programs',
              },
            ].map((f) => (
              <div key={f.tier} className="bg-slate-800 rounded-xl p-6 flex flex-col border border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`${f.badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded`}>{f.badge}</span>
                </div>
                <h3 className="text-lg font-extrabold text-white mb-1">{f.tier}</h3>
                <p className={`text-xl font-black mb-3 ${f.costColor}`}>{f.cost}</p>
                <p className="text-white/60 text-xs leading-relaxed mb-4">{f.desc}</p>
                <ul className="space-y-1.5 mb-6 flex-1">
                  {f.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-white/70">
                      <span className="text-brand-red-400 font-bold flex-shrink-0 mt-0.5">✔</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href={f.href} className="bg-brand-red-600 hover:bg-brand-red-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg text-center transition-colors">
                  {f.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROGRAMS ── */}
      <section className="bg-slate-900 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3 text-center">Programs Powered by the Elevate OS</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 text-center">Credential pathways built for real employment outcomes.</h2>
          <p className="text-white/70 text-sm text-center mb-8 max-w-xl mx-auto">
            Every program runs on the same compliant infrastructure — funding authorization, checkpoint-gated training, proctored credentialing, and employer placement.
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

      {/* ── PROOF STACK ── */}
      <section className="bg-slate-50 border-t border-slate-200 py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 text-center">System of Record</p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-10 text-center">Compliance infrastructure, not a badge wall.</h2>
          <div className="space-y-4">
            {/* Tier 1 */}
            <div className="bg-blue-600 rounded-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-black uppercase tracking-widest text-blue-200 w-16 flex-shrink-0">Tier 1</span>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">DOL Registered Apprenticeship Sponsor</p>
                <p className="text-blue-200 text-xs mt-0.5">RAPIDS-tracked. Federally recognized. OJT wage reimbursement eligible.</p>
              </div>
            </div>
            {/* Tier 2 */}
            <div className="bg-brand-red-600 rounded-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-black uppercase tracking-widest text-red-200 w-16 flex-shrink-0">Tier 2</span>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">Indiana ETPL Certified · WIOA Aligned</p>
                <p className="text-red-200 text-xs mt-0.5">Eligible Training Provider List approved. WorkOne referrals accepted. DWD compliant.</p>
              </div>
            </div>
            {/* Tier 3 */}
            <div className="bg-violet-600 rounded-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-black uppercase tracking-widest text-violet-200 w-16 flex-shrink-0">Tier 3</span>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">Authorized Testing Center — Certiport · NHA · EPA 608 · ACT WorkKeys · NRF</p>
                <p className="text-violet-200 text-xs mt-0.5">Proctored credentialing on-site. Exam funding authorized on program completion.</p>
              </div>
            </div>
            {/* Tier 4 */}
            <div className="bg-slate-700 rounded-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 w-16 flex-shrink-0">Tier 4</span>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">EmployIndy Partner · IRS VITA Certified · Government Contractor</p>
                <p className="text-slate-400 text-xs mt-0.5">Community partnerships, employer network, and federal contractor status.</p>
              </div>
            </div>
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
        <div className="max-w-4xl mx-auto text-center">
          <BlurIn>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Where do you fit in the system?</h2>
            <p className="text-white/70 text-base mb-10 max-w-xl mx-auto">
              Choose your entry point. Each path is built for a different stakeholder.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {[
                { label: 'Workforce Agency', sub: 'Refer participants, track outcomes', href: '/for-agencies', color: 'bg-blue-600 hover:bg-blue-700' },
                { label: 'Employer', sub: 'Hire graduates, sponsor apprentices', href: '/for-employers', color: 'bg-green-600 hover:bg-green-700' },
                { label: 'Program Holder', sub: 'Run programs on Elevate infrastructure', href: '/program-holder', color: 'bg-purple-600 hover:bg-purple-700' },
                { label: 'Learner', sub: 'Check eligibility and apply', href: '/apply', color: 'bg-brand-red-600 hover:bg-brand-red-700' },
              ].map((b) => (
                <Link key={b.label} href={b.href} className={`${b.color} text-white rounded-xl px-4 py-5 text-center transition-colors block`}>
                  <p className="font-bold text-sm mb-1">{b.label}</p>
                  <p className="text-white/70 text-xs">{b.sub}</p>
                </Link>
              ))}
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
