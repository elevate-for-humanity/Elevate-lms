export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import HeroVideo from '@/components/marketing/HeroVideo';
import MarqueeBanner from '@/components/MarqueeBanner';
import TrustStrip from '@/components/TrustStrip';
import { FadeInUp, StaggerChildren, StaggerItem, BlurIn } from '@/components/animations/PremiumAnimations';
import { ArrowRight } from 'lucide-react';
import heroBanners from '@/content/heroBanners';

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
  const hero = heroBanners.home;

  return (
    <main className="min-h-screen bg-white">

      {/* ── VIDEO HERO + BELOW-HERO COPY ── */}
      {/* HeroVideo renders the video frame and the below-hero content block together */}
      <HeroVideo
        videoSrcDesktop={hero.videoSrcDesktop}
        posterImage={hero.posterImage}
        voiceoverSrc={hero.voiceoverSrc}
        microLabel={hero.microLabel}
        transcript={hero.transcript}
        analyticsName={hero.analyticsName}
      >
        {/* Below-hero content — outside the video frame */}
        <BlurIn>
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">Indianapolis, Indiana</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
            We train adults for real jobs —<br className="hidden sm:block" /> in weeks, not years.
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-2xl">
            Short-term career training in healthcare, skilled trades, CDL, barbering, and technology.
            Most programs are available at no cost to eligible Indiana residents through WIOA and state funding.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/start" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-base">
              Start Here
            </Link>
            <Link href="/programs" className="border border-slate-300 text-slate-700 font-bold px-8 py-3.5 rounded-lg hover:bg-slate-50 transition-colors text-base">
              See All Programs
            </Link>
          </div>
        </BlurIn>
      </HeroVideo>

      {/* ── MARQUEE ── */}
      <MarqueeBanner />

      {/* ── TRUST STRIP ── */}
      <TrustStrip variant="compact" showAnimation />

      {/* ── AUDIENCE ROUTING ── */}
      <section className="bg-slate-50 border-b border-slate-200 py-8 sm:py-10">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Who are you here for?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Student */}
            <Link href="/start" className="group flex flex-col bg-white border-2 border-slate-200 hover:border-brand-red-500 rounded-xl overflow-hidden transition-all hover:shadow-md">
              <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                <Image src="/images/pages/adult-learner.jpg" alt="Student in workforce training" fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, 33vw" loading="lazy" />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <p className="font-bold text-slate-900 text-base mb-1">Student / Job Seeker</p>
                <p className="text-slate-500 text-sm leading-snug mb-4">See programs, start dates, and how to get funded training at no cost.</p>
                <span className="text-brand-red-600 text-sm font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 mt-auto">
                  Start here <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
            {/* Employer */}
            <Link href="/employer" className="group flex flex-col bg-white border-2 border-slate-200 hover:border-brand-blue-500 rounded-xl overflow-hidden transition-all hover:shadow-md">
              <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                <Image src="/images/pages/employer-handshake.jpg" alt="Employer hiring Elevate graduates" fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, 33vw" loading="lazy" />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <p className="font-bold text-slate-900 text-base mb-1">Employer / Hiring Partner</p>
                <p className="text-slate-500 text-sm leading-snug mb-4">Access pre-screened graduates, WOTC credits, and OJT reimbursement.</p>
                <span className="text-brand-blue-600 text-sm font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 mt-auto">
                  Hire graduates <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
            {/* Agency */}
            <Link href="/workforce-board" className="group flex flex-col bg-white border-2 border-slate-200 hover:border-slate-700 rounded-xl overflow-hidden transition-all hover:shadow-md">
              <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                <Image src="/images/pages/workforce-board.jpg" alt="Workforce agency and compliance reporting" fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, 33vw" loading="lazy" />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <p className="font-bold text-slate-900 text-base mb-1">Agency / Workforce Board</p>
                <p className="text-slate-500 text-sm leading-snug mb-4">Review compliance, outcomes reporting, and WIOA alignment documentation.</p>
                <span className="text-slate-700 text-sm font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 mt-auto">
                  View outcomes <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHAT WE DO ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <FadeInUp>
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">What We Do</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-12">Training. Credentials. Network.</h2>
          </FadeInUp>
          <StaggerChildren staggerDelay={0.15}>
            {[
              {
                label: 'Training',
                heading: 'Short-term programs, real credentials',
                body: 'Healthcare, skilled trades, CDL, barbering, and technology — 4 to 16 weeks, most fully funded. Every program ends with a proctored certification exam on-site at Elevate.',
                image: '/images/pages/training-classroom.jpg',
                alt: 'Students in workforce training classroom',
                link: '/programs',
                linkText: 'See all programs',
              },
              {
                label: 'Credentials',
                heading: 'Exam prep to verified certification',
                body: 'Credentials are issued by the national certifying body — EPA, PTCB, CompTIA, NCCER, Indiana ISDH. Portable and verifiable nationwide. Elevate tracks eligibility and coordinates testing.',
                image: '/images/pages/career-services-hero.jpg',
                alt: 'Credential pathway and certification tracking',
                link: '/credentials',
                linkText: 'View credentials',
                reverse: true,
              },
              {
                label: 'Network',
                heading: 'Employers, agencies, and partners',
                body: 'One platform connects training providers, workforce agencies, and hiring employers for outcome tracking and placement. Many students have job offers before their last day of class.',
                image: '/images/pages/employer-hero.jpg',
                alt: 'Employers and workforce agencies collaborating',
                link: '/platform',
                linkText: 'Explore the network',
              },
            ].map((item) => (
              <StaggerItem key={item.label}>
                <div className={`flex flex-col sm:flex-row gap-8 items-center mb-16 last:mb-0 ${item.reverse ? 'sm:flex-row-reverse' : ''}`}>
                  <div className="relative w-full sm:w-1/2 rounded-xl overflow-hidden flex-shrink-0" style={{ aspectRatio: '4/3' }}>
                    <Image src={item.image} alt={item.alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
                  </div>
                  <div className="sm:w-1/2">
                    <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">{item.label}</p>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{item.heading}</h3>
                    <p className="text-slate-600 leading-relaxed mb-4">{item.body}</p>
                    <Link href={item.link} className="inline-flex items-center text-brand-red-600 font-semibold hover:text-brand-red-700">
                      {item.linkText} <ArrowRight className="ml-1 w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>


      {/* ── HOW IT WORKS ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <FadeInUp>
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">The Process</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">From your first call to your first paycheck</h2>
            <p className="text-slate-600 max-w-2xl leading-relaxed mb-12">
              We handle the complexity — funding paperwork, scheduling, credential testing, and employer introductions. You focus on training.
            </p>
          </FadeInUp>
          <StaggerChildren staggerDelay={0.12}>
            {[
              { num: '01', title: 'Check your eligibility', desc: 'Register at Indiana Career Connect and meet with a WorkOne case manager. They determine which funding you qualify for — WIOA, Workforce Ready Grant, or JRI. Free, takes about a week.', image: '/images/pages/wioa-meeting.jpg', alt: 'WorkOne career counseling session' },
              { num: '02', title: 'Enroll in a cohort', desc: 'Once funding is confirmed, you join a scheduled cohort. Training combines classroom instruction, hands-on lab work, and online coursework. All tools, materials, and safety gear are provided.', image: '/images/pages/training-cohort.jpg', alt: 'Students enrolled in a training cohort' },
              { num: '03', title: 'Earn your credential', desc: 'You sit for a proctored certification exam on-site at Elevate. Your credential is issued by the national certifying body — EPA, OSHA, Indiana ISDH, Certiport, or AWS. Portable and verifiable nationwide.', image: '/images/pages/healthcare-grad.jpg', alt: 'Graduate earning a nationally recognized credential' },
              { num: '04', title: 'Get placed with an employer', desc: 'Our career services team builds your resume, preps you for interviews, and makes direct introductions to hiring employers. Many students have job offers before their last day of class.', image: '/images/pages/employer-handshake.jpg', alt: 'Graduate meeting with employer' },
            ].map((step, i) => (
              <StaggerItem key={step.num}>
                <div className={`flex flex-col sm:flex-row gap-8 items-start mb-14 last:mb-0 ${i % 2 !== 0 ? 'sm:flex-row-reverse' : ''}`}>
                  <div className="relative w-full sm:w-2/5 rounded-xl overflow-hidden flex-shrink-0" style={{ aspectRatio: '4/3' }}>
                    <Image src={step.image} alt={step.alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, 40vw" />
                  </div>
                  <div className="sm:w-3/5 pt-2">
                    <p className="text-brand-red-600 font-extrabold text-xs uppercase tracking-widest mb-2">{step.num}</p>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
          <FadeInUp delay={0.2}>
            <Link href="/how-it-works" className="inline-flex items-center border border-slate-900 text-slate-900 font-bold px-8 py-3 rounded-lg hover:bg-slate-900 hover:text-white transition-colors text-sm mt-4">
              Full Process Details <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </FadeInUp>
        </div>
      </section>

      {/* ── FUNDING ── */}
      <section className="py-16 sm:py-20 bg-brand-red-700">
        <div className="max-w-4xl mx-auto px-6">
          <FadeInUp>
            <p className="text-brand-red-200 font-bold text-xs uppercase tracking-widest mb-3">Funding</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Most participants pay $0 for training</h2>
            <p className="text-brand-red-100 leading-relaxed mb-10 max-w-2xl">
              Federal and Indiana state workforce funding covers tuition, books, tools, and certification exam fees for eligible participants.
            </p>
          </FadeInUp>
          <StaggerChildren staggerDelay={0.1}>
            {[
              { label: 'WIOA', tag: 'Federal', desc: 'Primary federal workforce funding. Covers tuition, books, tools, and exam fees for eligible adults, dislocated workers, and youth 16–24.' },
              { label: 'Workforce Ready Grant', tag: 'Indiana State', desc: 'Indiana state grant covering high-demand certification programs at no cost for eligible participants in healthcare, IT, and skilled trades.' },
              { label: 'JRI — Job Ready Indy', tag: 'Indiana State', desc: 'Funded career training for eligible justice-involved individuals through Indiana DWD. Many Elevate employer partners hire regardless of background.' },
            ].map((f) => (
              <StaggerItem key={f.label}>
                <div className="bg-white/10 rounded-xl p-6 mb-4 last:mb-0">
                  <p className="text-brand-red-200 text-xs font-bold uppercase tracking-widest mb-1">{f.tag}</p>
                  <h3 className="text-white font-bold text-base mb-2">{f.label}</h3>
                  <p className="text-brand-red-100 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
          <FadeInUp delay={0.3}>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link href="/wioa-eligibility" className="bg-white text-brand-red-700 font-bold px-8 py-3.5 rounded-lg hover:bg-brand-red-50 transition-colors">
                Check My Eligibility
              </Link>
              <Link href="/funding" className="border border-white/40 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors">
                All Funding Options
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* ── PARTNERS STRIP ── */}
      <section className="py-10 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">For Employers &amp; Agencies</p>
            <p className="text-slate-700 text-sm max-w-md">Pre-screened graduates, WOTC credits, OJT reimbursement, and WIOA compliance reporting — all in one place.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link href="/employer" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-5 py-2.5 rounded-lg transition-colors text-sm">
              Employer Portal
            </Link>
            <Link href="/workforce-board" className="border border-slate-300 text-slate-700 font-semibold px-5 py-2.5 rounded-lg hover:bg-white transition-colors text-sm">
              Workforce Board
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <FadeInUp>
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">Student Outcomes</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-10">Real students. Real results.</h2>
          </FadeInUp>
          <StaggerChildren staggerDelay={0.1}>
            {[
              { quote: "WIOA paid for my Medical Assistant training, and I started working right after graduation. Now I'm making $42,000 a year with full benefits.", name: 'Sarah M.', program: 'Medical Assistant', salary: '$42K/yr', photo: '/images/testimonials-hq/person-1.jpg' },
              { quote: "They provided an extremely informative and hospitable environment. I really enjoyed my classes. The staff made everything easy to understand.", name: 'Timothy S.', program: 'CDL Training', salary: '$55K/yr', photo: '/images/testimonials-hq/person-4.jpg' },
              { quote: "Anyone who wants to grow and make more money should try Elevate. You deserve it. The staff is amazing and easy to communicate with.", name: 'Jasmine R.', program: 'CNA Certification', salary: '$38K/yr', photo: '/images/testimonials-hq/person-3.jpg' },
            ].map((t) => (
              <StaggerItem key={t.name}>
                <div className="flex flex-col sm:flex-row gap-6 py-8 border-b border-slate-200 last:border-0">
                  <Image src={t.photo} alt={t.name} width={64} height={64} className="rounded-full object-cover w-16 h-16 flex-shrink-0" />
                  <div>
                    <div className="flex gap-0.5 mb-3">
                      {[1,2,3,4,5].map((s) => <span key={s} className="text-amber-400 text-sm">★</span>)}
                    </div>
                    <p className="text-slate-700 leading-relaxed mb-3">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                      <span className="text-slate-600">·</span>
                      <p className="text-slate-500 text-sm">{t.program}</p>
                      <span className="text-brand-green-700 font-bold text-xs bg-brand-green-50 px-2 py-0.5 rounded-full">{t.salary}</span>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ── OUTCOMES ── */}
      <section className="py-12 sm:py-14 bg-slate-900 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Workforce Outcomes</p>
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
                <div className="text-xs text-slate-400">{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <BlurIn>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Ready to start?</h2>
            <p className="text-slate-600 text-lg mb-8 leading-relaxed max-w-xl mx-auto">
              Apply online in minutes. Training may be fully funded. Graduate with a nationally recognized credential and a job offer.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/start" className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-4 rounded-lg font-bold text-lg transition-colors">
                Start Here — It&apos;s Free
              </Link>
              <Link href="/programs" className="border border-slate-300 text-slate-700 px-10 py-4 rounded-lg font-bold text-lg hover:bg-white transition-colors">
                View Programs
              </Link>
            </div>
          </BlurIn>
        </div>
      </section>

    </main>
  );
}
