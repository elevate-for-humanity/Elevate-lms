import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import HomeHeroVideo from '@/components/ui/HomeHeroVideo';
import RotatingHeroBanner from '@/components/RotatingHeroBanner';
import MarqueeBanner from '@/components/MarqueeBanner';
import TrustStrip from '@/components/TrustStrip';
import { FadeInUp, StaggerChildren, StaggerItem, BlurIn } from '@/components/animations/PremiumAnimations';
import { ArrowRight } from 'lucide-react';

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

const PROGRAMS = [
  { name: 'CNA Certification',      image: '/images/pages/cna-patient-care.jpg',    href: '/programs/cna',                   duration: '4–6 weeks',   sector: 'Healthcare',     salary: '$30K–$42K' },
  { name: 'CDL Commercial Driving', image: '/images/pages/cdl-truck-highway.jpg',   href: '/programs/cdl-training',          duration: '4–6 weeks',   sector: 'Transportation', salary: '$50K+' },
  { name: 'Barber Apprenticeship',  image: '/images/pages/barber-fade.jpg',          href: '/programs/barber-apprenticeship', duration: '~18 months',  sector: 'Barbering',      salary: '$30K–$60K+' },
  { name: 'HVAC / Building Tech',   image: '/images/pages/hvac-unit.jpg',            href: '/programs/hvac-technician',       duration: '12 weeks',    sector: 'Skilled Trades', salary: '$48K–$80K' },
  { name: 'Electrical',             image: '/images/pages/electrical-wiring.jpg',    href: '/programs/electrical',            duration: '12–16 weeks', sector: 'Skilled Trades', salary: '$56K–$100K+' },
  { name: 'Welding',                image: '/images/pages/welding-sparks.jpg',        href: '/programs/welding',               duration: '12–16 weeks', sector: 'Skilled Trades', salary: '$54K–$150K+' },
  { name: 'IT Support',             image: '/images/pages/it-helpdesk-desk.jpg',     href: '/programs/it-help-desk',          duration: '8–12 weeks',  sector: 'Technology',     salary: '$35K–$60K' },
  { name: 'Cybersecurity',          image: '/images/pages/cybersecurity-screen.jpg', href: '/programs/cybersecurity-analyst', duration: '12–16 weeks', sector: 'Technology',     salary: '$55K–$100K+' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ── VIDEO HERO ── */}
      <section className="relative h-[56vw] min-h-[320px] max-h-[700px] overflow-hidden">
        <HomeHeroVideo />
      </section>

      {/* ── MARQUEE ── */}
      <MarqueeBanner />

      {/* ── ROTATING IMAGE BANNER ── */}
      <RotatingHeroBanner />

      {/* ── HERO COPY ── */}
      <section className="bg-white py-12 sm:py-16 border-b">
        <div className="max-w-4xl mx-auto px-6">
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
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <TrustStrip variant="compact" showAnimation />



      {/* ── WHAT WE DO ── */}
      <section className="py-16 sm:py-20 bg-white">
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

      {/* ── PROGRAMS ── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <FadeInUp>
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">Programs</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-10">Career pathways we offer</h2>
          </FadeInUp>
          <StaggerChildren staggerDelay={0.06}>
            {PROGRAMS.map((p) => (
              <StaggerItem key={p.name}>
                <Link href={p.href} className="group flex items-center gap-5 py-4 border-b border-slate-100 hover:border-slate-300 transition-colors">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="56px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.sector} · {p.duration}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-brand-green-700">{p.salary}</p>
                    <p className="text-[10px] text-slate-400">starting</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors flex-shrink-0" />
                </Link>
              </StaggerItem>
            ))}
          </StaggerChildren>
          <FadeInUp delay={0.3}>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/programs" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors">
                View Full Program Details
              </Link>
              <Link href="/credentials" className="border border-slate-300 text-slate-700 font-bold px-8 py-3.5 rounded-lg hover:bg-white transition-colors">
                View All Credentials
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 sm:py-20 bg-white">
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
      <section className="py-16 sm:py-20 bg-brand-red-600">
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
              <Link href="/wioa-eligibility" className="bg-white text-brand-red-600 font-bold px-8 py-3.5 rounded-lg hover:bg-brand-red-50 transition-colors">
                Check My Eligibility
              </Link>
              <Link href="/funding" className="border border-white/40 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors">
                All Funding Options
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* ── EMPLOYERS ── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row gap-10 items-center">
            <FadeInUp className="w-full sm:w-1/2">
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <Image src="/images/pages/graduation-ceremony.jpg" alt="Credentialed Elevate graduates" fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
              </div>
            </FadeInUp>
            <FadeInUp delay={0.15} className="w-full sm:w-1/2">
              <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">For Employers</p>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">We build your next workforce pipeline</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Every graduate holds a nationally recognized credential, has completed hands-on training,
                and has been pre-screened before we make an introduction.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  'WOTC tax credits: $2,400–$9,600 per qualifying hire',
                  'OJT wage reimbursement: 50–75% of wages during training',
                  'Registered Apprenticeship pathways with DOL compliance handled',
                  'Custom cohorts trained to your specifications',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-red-600 mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link href="/employer" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm">
                  Employer Portal
                </Link>
                <Link href="/apply/program-holder" className="border border-slate-300 text-slate-700 font-bold px-6 py-3 rounded-lg hover:bg-white transition-colors text-sm">
                  Become a Training Partner
                </Link>
              </div>
            </FadeInUp>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-16 sm:py-20 bg-white">
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
                      <span className="text-slate-300">·</span>
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

      {/* ── CTA ── */}
      <section className="py-20 sm:py-24 bg-white">
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
