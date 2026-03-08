import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import HomeHeroVideo from './HomeHeroVideo';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export const metadata: Metadata = {
  title: 'Elevate for Humanity | Workforce Credential Institute — Indianapolis, Indiana',
  description: 'Indianapolis workforce credential institute. Career training in healthcare, skilled trades, CDL, barbering, and technology. WIOA and state funding available. Most programs cost $0 for eligible participants.',
};

const PROGRAMS = [
  { name: 'CNA Certification',            image: '/images/pages/cna-nursing.jpg',       href: '/programs/cna',                   duration: '4–6 weeks',   sector: 'Healthcare',      salary: '$30K–$42K' },
  { name: 'CDL Commercial Driving',       image: '/images/pages/cdl-training.jpg',      href: '/programs/cdl-training',          duration: '4–6 weeks',   sector: 'Transportation',  salary: '$50K+' },
  { name: 'Barber Apprenticeship',        image: '/images/pages/barber-hero-main.jpg',  href: '/programs/barber-apprenticeship', duration: '~18 months',  sector: 'Barbering',       salary: '$30K–$60K+' },
  { name: 'HVAC / Building Technician',   image: '/images/pages/hvac-technician.jpg',   href: '/programs/hvac-technician',       duration: '12–16 weeks', sector: 'Skilled Trades',  salary: '$48K–$80K' },
  { name: 'Electrical',                   image: '/images/pages/electrical.jpg',        href: '/programs/electrical',            duration: '12–16 weeks', sector: 'Skilled Trades',  salary: '$56K–$100K+' },
  { name: 'Welding',                      image: '/images/pages/welding.jpg',           href: '/programs/welding',               duration: '12–16 weeks', sector: 'Skilled Trades',  salary: '$54K–$150K+' },
  { name: 'IT Support',                   image: '/images/pages/it-help-desk.jpg',      href: '/programs/it-help-desk',          duration: '8–12 weeks',  sector: 'Technology',      salary: '$35K–$60K' },
  { name: 'Cybersecurity',                image: '/images/pages/cybersecurity.jpg',     href: '/programs/cybersecurity-analyst', duration: '12–16 weeks', sector: 'Technology',      salary: '$55K–$100K+' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ─── ENROLLMENT BANNER ─── */}
      <div className="bg-brand-green-600 text-white py-2.5 text-center text-sm font-semibold tracking-wide">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-3 flex-wrap">
          <span>Now Enrolling — Funded Credential Programs in Healthcare, Trades, CDL &amp; Technology</span>
          <Link href="/apply" className="inline-flex items-center gap-1 bg-white text-brand-green-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-brand-green-50 transition-colors">
            Check Eligibility →
          </Link>
        </div>
      </div>

      {/* ─── HERO VIDEO ─── */}
      <section className="relative w-full h-[55vh] sm:h-[65vh] md:h-[72vh] min-h-[300px] overflow-hidden">
        <HomeHeroVideo />
      </section>

      {/* ─── SECTION 1: WHO WE ARE ─── */}
      <section className="bg-slate-900 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: plain-language explanation */}
            <div>
              <p className="text-brand-red-400 font-bold text-xs uppercase tracking-widest mb-3">Indianapolis, Indiana</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-5">
                We train adults for real jobs — in weeks, not years.
              </h1>
              <p className="text-slate-300 text-lg leading-relaxed mb-4">
                Elevate for Humanity is a workforce credential institute based in Indianapolis. We run short-term career training programs in healthcare, skilled trades, CDL driving, barbering, and technology. Programs run 4 to 16 weeks. Most are fully funded at no cost to eligible participants.
              </p>
              <p className="text-slate-400 text-base leading-relaxed mb-8">
                We are not a college. We are not a staffing agency. We are a training institute that takes you from where you are today to a nationally recognized credential and a job offer — with funding, hands-on instruction, and employer connections built into every program.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/apply/student" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-all shadow-lg shadow-brand-red-600/30 text-base">
                  Apply Now — It&apos;s Free
                </Link>
                <Link href="/programs" className="bg-white/10 border border-white/25 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/20 transition-all text-base">
                  See All Programs
                </Link>
              </div>
            </div>

            {/* Right: credential trust badges */}
            <div className="flex flex-col gap-4">
              <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden shadow-xl">
                <Image src="/images/pages/workforce-training.jpg" alt="Elevate for Humanity career training" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
              </div>
              <div className="bg-brand-green-900/40 border border-brand-green-700/40 rounded-xl p-4 text-center">
                <p className="text-brand-green-300 text-sm font-semibold">U.S. DOL Registered Apprenticeship Sponsor · Indiana DWD ETPL Provider · EPA 608 Authorized Testing Center</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── SECTION 2: PROGRAMS ─── */}
      <div className="h-1.5 bg-brand-red-600" aria-hidden="true" />
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <div className="mb-10">
              <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Career Pathways</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">8 programs. Nationally recognized credentials. Real hiring outcomes.</h2>
              <p className="text-slate-600 max-w-3xl leading-relaxed">
                Every Elevate program ends with a credential issued by an independent national certifying body — not by us. That means your certification is portable, verifiable, and recognized by employers across the country. We prepare you for the exam. The credential comes from the authority that matters.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PROGRAMS.map((p, i) => (
              <ScrollReveal key={p.name} delay={i * 50}>
                <Link href={p.href} className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-brand-red-300 transition-all flex flex-col h-full">
                  <div className="relative overflow-hidden" style={{ aspectRatio: '3/2' }}>
                    <Image src={p.image} alt={p.name + ' training'} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 left-2">
                      <span className="bg-slate-900/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">{p.sector}</span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{p.name}</h3>
                    <p className="text-xs text-slate-500 mb-1">{p.duration}</p>
                    <p className="text-xs text-brand-green-700 font-semibold mt-auto">{p.salary} starting salary</p>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/programs" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors">
              View Full Program Details
            </Link>
            <Link href="/credentials" className="border-2 border-slate-300 text-slate-700 font-bold px-8 py-3.5 rounded-lg hover:bg-slate-50 transition-colors">
              View All Credentials
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: HOW IT WORKS ─── */}
      <div className="h-1.5 bg-slate-900" aria-hidden="true" />
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <div className="mb-10">
              <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">The Process</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">From your first call to your first paycheck</h2>
              <p className="text-slate-600 max-w-2xl leading-relaxed">
                We handle the complexity — funding paperwork, scheduling, credential testing, and employer introductions. You focus on training. Here is exactly what happens, in order.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              {
                num: '01',
                title: 'Check your eligibility',
                desc: 'Register at Indiana Career Connect and meet with a WorkOne case manager. They review your income, employment history, and barriers to determine which funding you qualify for — WIOA, Workforce Ready Grant, or JRI. This is free and takes about a week.',
              },
              {
                num: '02',
                title: 'Enroll in a cohort',
                desc: 'Once funding is confirmed, you join a scheduled cohort — a group that starts and finishes together. Training combines classroom instruction, hands-on lab work, and online coursework. All tools, materials, uniforms, and safety gear are provided.',
              },
              {
                num: '03',
                title: 'Earn your credential',
                desc: 'At the end of training, you sit for a proctored certification exam on-site at Elevate. Your credential is issued by the national certifying body — EPA, OSHA, Indiana ISDH, Indiana BMV, Certiport, or AWS. Not by us. Portable and verifiable nationwide.',
              },
              {
                num: '04',
                title: 'Get placed with an employer',
                desc: 'Our career services team builds your resume, preps you for interviews, and makes direct introductions to hiring employers. Many students have job offers before their last day of class. We track your employment at 6 and 12 months.',
              },
            ].map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 80}>
                <div className="bg-white rounded-xl border border-slate-200 p-6 h-full flex flex-col">
                  <div className="w-10 h-10 rounded-full bg-brand-red-600 text-white font-extrabold text-sm flex items-center justify-center mb-4 flex-shrink-0">{step.num}</div>
                  <h3 className="font-bold text-slate-900 mb-2 text-base">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed flex-1">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <Link href="/how-it-works" className="inline-block border-2 border-slate-900 text-slate-900 font-bold px-8 py-3 rounded-lg hover:bg-slate-900 hover:text-white transition-colors text-sm">
            Full Process Details →
          </Link>
        </div>
      </section>

      {/* ─── SECTION 4: FUNDING ─── */}
      <div className="h-1.5 bg-brand-green-600" aria-hidden="true" />
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <div className="mb-10">
              <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Funding</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Most participants pay $0 for training</h2>
              <p className="text-slate-600 max-w-3xl leading-relaxed">
                Federal and Indiana state workforce funding covers tuition, books, tools, and certification exam fees for eligible participants. You do not apply for funding through Elevate — eligibility is determined through WorkOne career centers. We help you navigate the process and handle the paperwork.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {[
              {
                label: 'WIOA — Workforce Innovation and Opportunity Act',
                tag: 'Federal',
                tagColor: 'bg-brand-blue-700',
                desc: 'The primary federal workforce funding program. Covers tuition, books, tools, and certification exam fees for eligible adults, dislocated workers, and youth ages 16–24. Administered through WorkOne career centers.',
                href: '/funding/federal-programs',
                image: '/images/hp/wioa.jpg',
              },
              {
                label: 'Workforce Ready Grant',
                tag: 'Indiana State',
                tagColor: 'bg-brand-green-700',
                desc: 'Indiana state grant covering high-demand certification programs at no cost for eligible participants. Covers tuition and fees for programs in healthcare, IT, and skilled trades.',
                href: '/funding/state-programs',
                image: '/images/hp/grants.jpg',
              },
              {
                label: 'Next Level Jobs',
                tag: 'Indiana State',
                tagColor: 'bg-brand-green-700',
                desc: 'Indiana employer training grant covering certification costs in high-demand fields. Employers and training providers apply on behalf of participants.',
                href: '/funding/state-programs',
                image: '/images/hp/funding.jpg',
              },
              {
                label: 'JRI — Justice Reinvestment Initiative',
                tag: 'Indiana State',
                tagColor: 'bg-brand-green-700',
                desc: 'Funded career training for eligible justice-involved individuals through Indiana DWD. Many Elevate employer partners hire regardless of background.',
                href: '/funding/jri',
                image: '/images/hp/healthcare.jpg',
              },
              {
                label: 'Job Ready Indy',
                tag: 'Indianapolis',
                tagColor: 'bg-brand-orange-600',
                desc: 'Indianapolis workforce initiative connecting Marion County residents to funded credential training programs. Separate from JRI — for city residents regardless of justice involvement.',
                href: '/funding/job-ready-indy',
                image: '/images/pages/jri-hero.jpg',
              },
              {
                label: 'Indiana Career Connect',
                tag: 'State Portal',
                tagColor: 'bg-slate-600',
                desc: 'The official Indiana portal to register, check eligibility, and apply for workforce funding. Start here if you are not sure which program you qualify for.',
                href: 'https://indianacareerconnect.com',
                image: '/images/hp/government.jpg',
                external: true,
              },
            ].map((item, i) => (
              <ScrollReveal key={item.label} delay={i * 60}>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow">
                  <div className="relative overflow-hidden" style={{ aspectRatio: '16/7' }}>
                    <Image src={item.image} alt={item.label} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
                    <div className="absolute top-2 left-2">
                      <span className={`${item.tagColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>{item.tag}</span>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-900 mb-2 text-sm leading-snug">{item.label}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed flex-1 mb-3">{item.desc}</p>
                    <Link href={item.href} {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="text-brand-red-600 font-semibold text-xs hover:underline">
                      Learn More →
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/wioa-eligibility" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-center">
              Check My Eligibility
            </Link>
            <Link href="/funding" className="border-2 border-slate-300 text-slate-700 font-bold px-8 py-3.5 rounded-lg hover:bg-slate-50 transition-colors text-center">
              All Funding Options
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: EMPLOYERS ─── */}
      <div className="h-1.5 bg-brand-red-600" aria-hidden="true" />
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden shadow-xl order-last lg:order-first">
              <Image src="/images/hp/candidates.jpg" alt="Credentialed Elevate graduates ready for employment" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
            <div>
              <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">For Employers</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">We build your next workforce pipeline</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Elevate trains workers specifically for the jobs Indiana employers are hiring for right now. Every graduate holds a nationally recognized credential, has completed hands-on training, and has been pre-screened by our career services team before we make an introduction.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                We are not a job board. We are a training partner. We run cohorts on your timeline, train to your job requirements, and handle all the funding paperwork so you can focus on hiring.
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
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/employer" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-center text-sm">
                  Employer Portal
                </Link>
                <Link href="/apply/program-holder" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-lg transition-colors text-center text-sm">
                  Become a Training Partner
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: TESTIMONIALS ─── */}
      <div className="h-1.5 bg-slate-900" aria-hidden="true" />
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <div className="mb-10">
              <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Student Outcomes</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Real students. Real results.</h2>
              <p className="text-slate-600 max-w-xl leading-relaxed">
                These are graduates who came to Elevate without a credential, went through a funded program, and are now working in their field.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'WIOA paid for my Medical Assistant training, and I started working right after graduation. Now I\'m making $42,000 a year with full benefits.',
                name: 'Sarah M.',
                program: 'Medical Assistant',
                salary: '$42K/yr',
                photo: '/images/testimonials-hq/person-1.jpg',
              },
              {
                quote: 'They provided an extremely informative and hospitable environment. I really enjoyed my classes. The staff made everything easy to understand.',
                name: 'Timothy S.',
                program: 'CDL Training',
                salary: '$55K/yr',
                photo: '/images/testimonials-hq/person-4.jpg',
              },
              {
                quote: 'Anyone who wants to grow and make more money should try Elevate. You deserve it. The staff is amazing and easy to communicate with.',
                name: 'Jasmine R.',
                program: 'CNA Certification',
                salary: '$38K/yr',
                photo: '/images/testimonials-hq/person-3.jpg',
              },
            ].map((t) => (
              <ScrollReveal key={t.name}>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 h-full flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {[1,2,3,4,5].map((s) => <span key={s} className="text-amber-400 text-sm">★</span>)}
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed mb-6 flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Image src={t.photo} alt={t.name} width={40} height={40} className="rounded-full object-cover w-10 h-10" />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                        <p className="text-slate-500 text-xs">{t.program}</p>
                      </div>
                    </div>
                    <span className="text-brand-green-700 font-bold text-xs bg-brand-green-50 px-2.5 py-1 rounded-full">{t.salary}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: CTA ─── */}
      <section className="py-16 sm:py-20 bg-brand-red-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Ready to start?</h2>
          <p className="text-white/85 text-lg mb-8 leading-relaxed">
            Apply online in minutes. Training may be fully funded. Graduate with a nationally recognized credential and a job offer.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/apply/student" className="bg-white text-brand-red-600 px-10 py-4 rounded-lg font-bold text-lg hover:bg-slate-50 transition-colors">
              Apply Now
            </Link>
            <Link href="/programs" className="border-2 border-white/40 text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition-colors">
              View Programs
            </Link>
          </div>
        </div>
      </section>

      {/* ─── PARTNER LOGOS ─── */}
      <section className="py-8 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">Recognized By</p>
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
            {[
              { src: '/images/partners/usdol.webp',        alt: 'U.S. Department of Labor' },
              { src: '/images/partners/dwd.webp',          alt: 'Indiana DWD' },
              { src: '/images/partners/workone.webp',      alt: 'WorkOne Indiana' },
              { src: '/images/partners/nextleveljobs.webp', alt: 'Next Level Jobs' },
            ].map((logo) => (
              <Image key={logo.alt} src={logo.src} alt={logo.alt} width={100} height={40} className="object-contain h-8 w-auto opacity-60 hover:opacity-100 transition-opacity" />
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
