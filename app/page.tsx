import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import HomeHeroVideo from '@/components/ui/HomeHeroVideo';
import MarqueeBanner from '@/components/MarqueeBanner';
import TrustStrip from '@/components/TrustStrip';
import VoiceoverWithMusic from '@/components/VoiceoverWithMusic';
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


export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ── VIDEO HERO ── */}
      <section className="relative h-[56vw] min-h-[320px] max-h-[700px] overflow-hidden">
        <HomeHeroVideo />
      </section>

      {/* ── MARQUEE ── */}
      <MarqueeBanner />

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
                <Image src="/images/pages/hire-graduates-page-1.jpg" alt="Employer hiring Elevate graduates" fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, 33vw" loading="lazy" />
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
                <Image src="/images/pages/workforce-board-page-1.jpg" alt="Workforce agency and compliance reporting" fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, 33vw" loading="lazy" />
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

      {/* ── TRAINING PROGRAMS ── */}
      <section className="py-16 sm:py-20 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeInUp>
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Training Programs</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Career pathways we offer</h2>
            <p className="text-slate-500 mb-10">Short-term. Credential-bearing. Most fully funded through WIOA and Indiana state grants.</p>
          </FadeInUp>
          <StaggerChildren staggerDelay={0.07}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  sector: 'Healthcare',
                  title: 'CNA Certification',
                  desc: 'Become a Certified Nursing Assistant in 4–6 weeks. Clinical training included. Indiana ISDH credential. WIOA eligible.',
                  image: '/images/pages/cna-patient-care.jpg',
                  alt: 'CNA student practicing patient care',
                  salary: '$30K–$42K',
                  duration: '4–6 weeks',
                  href: '/programs/cna',
                },
                {
                  sector: 'Skilled Trades',
                  title: 'HVAC Technician',
                  desc: 'EPA Section 608 certification. Hands-on lab training in heating, cooling, and refrigeration systems. High demand statewide.',
                  image: '/images/pages/hvac-unit.jpg',
                  alt: 'HVAC technician working on equipment',
                  salary: '$48K–$80K',
                  duration: '12 weeks',
                  href: '/programs/hvac-technician',
                },
                {
                  sector: 'Transportation',
                  title: 'CDL Commercial Driving',
                  desc: 'Class A CDL training with pre-trip inspection, backing, and road test prep. DOT physical included. Job placement assistance.',
                  image: '/images/pages/cdl-training.jpg',
                  alt: 'CDL commercial driving training',
                  salary: '$50K–$75K+',
                  duration: '4–6 weeks',
                  href: '/programs/cdl-training',
                },
                {
                  sector: 'Skilled Trades',
                  title: 'Welding',
                  desc: 'AWS-aligned welding training covering MIG, TIG, and stick. Hands-on shop time from day one. NCCER credential pathway.',
                  image: '/images/pages/welding-torch.jpg',
                  alt: 'Welding student using a torch in the shop',
                  salary: '$54K–$150K+',
                  duration: '12–16 weeks',
                  href: '/programs/welding',
                },
                {
                  sector: 'Technology',
                  title: 'IT Support / Help Desk',
                  desc: 'CompTIA A+ and IT Fundamentals prep. Troubleshooting, networking basics, and help desk operations. Remote and on-site roles.',
                  image: '/images/pages/it-helpdesk-desk.jpg',
                  alt: 'IT support student at a help desk',
                  salary: '$35K–$60K',
                  duration: '8–12 weeks',
                  href: '/programs/it-help-desk',
                },
                {
                  sector: 'Personal Services',
                  title: 'Barber Apprenticeship',
                  desc: 'DOL Registered Apprenticeship. 2,000 hours of OJT at a licensed barbershop. Earn while you learn. Indiana Barber License pathway.',
                  image: '/images/pages/barber-client-chair.jpg',
                  alt: 'Barber apprentice working with a client',
                  salary: '$30K–$60K+',
                  duration: '12–18 months',
                  href: '/programs/barber-apprenticeship',
                },
              ].map((p) => (
                <StaggerItem key={p.title}>
                  <Link
                    href={p.href}
                    className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-brand-red-300 hover:shadow-lg transition-all h-full"
                  >
                    {/* Picture */}
                    <div className="relative w-full flex-shrink-0" style={{ aspectRatio: '16/9' }}>
                      <Image
                        src={p.image}
                        alt={p.alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading="lazy"
                      />
                      <span className="absolute top-3 left-3 bg-white/90 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {p.sector}
                      </span>
                    </div>
                    {/* Card body */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-extrabold text-slate-900 text-base mb-2">{p.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-1">{p.desc}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div>
                          <p className="text-brand-green-700 font-bold text-sm">{p.salary}</p>
                          <p className="text-slate-400 text-xs">{p.duration}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-brand-red-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                          Learn more <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </div>
          </StaggerChildren>
          <FadeInUp delay={0.2}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/programs" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm">
                View All Programs
              </Link>
              <Link href="/credentials" className="border border-slate-300 text-slate-700 font-bold px-8 py-3.5 rounded-lg hover:bg-slate-50 transition-colors text-sm">
                View Credentials
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* ── FUNDING ── */}
      <section className="py-16 sm:py-20 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeInUp>
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Funding</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Most participants pay $0 for training</h2>
            <p className="text-slate-500 leading-relaxed mb-10 max-w-2xl">
              Federal and Indiana state workforce funding covers tuition, books, tools, and certification exam fees for eligible participants.
            </p>
          </FadeInUp>
          <StaggerChildren staggerDelay={0.1}>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                {
                  label: 'WIOA Title I',
                  tag: 'Federal',
                  desc: 'Primary federal workforce funding. Covers tuition, books, tools, and exam fees for eligible adults, dislocated workers, and youth 16–24.',
                  color: 'border-brand-blue-200 bg-brand-blue-50',
                  tagColor: 'bg-brand-blue-100 text-brand-blue-700',
                },
                {
                  label: 'Workforce Ready Grant',
                  tag: 'Indiana State',
                  desc: 'Indiana state grant for high-demand certifications in healthcare, IT, and skilled trades. No repayment required for eligible participants.',
                  color: 'border-brand-green-200 bg-brand-green-50',
                  tagColor: 'bg-brand-green-100 text-brand-green-700',
                },
                {
                  label: 'Justice Reinvestment Initiative',
                  tag: 'Indiana DWD',
                  desc: 'State-funded training for justice-involved individuals. Covers tuition and supportive services. Many Elevate employer partners hire regardless of background.',
                  color: 'border-brand-orange-200 bg-brand-orange-50',
                  tagColor: 'bg-brand-orange-100 text-brand-orange-700',
                },
              ].map((f) => (
                <StaggerItem key={f.label}>
                  <div className={`rounded-2xl border p-6 h-full ${f.color}`}>
                    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3 ${f.tagColor}`}>{f.tag}</span>
                    <h3 className="text-slate-900 font-bold text-base mb-2">{f.label}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </StaggerChildren>
          <FadeInUp delay={0.3}>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link href="/wioa-eligibility" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors">
                Check My Eligibility
              </Link>
              <Link href="/funding" className="border border-slate-300 text-slate-700 font-bold px-8 py-3.5 rounded-lg hover:bg-slate-50 transition-colors">
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
            <div className="w-full sm:w-1/2 flex-shrink-0">
              <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <Image src="/images/pages/for-employers-page-1.jpg" alt="Elevate graduates meeting with hiring employers" fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
              </div>
            </div>
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

      <VoiceoverWithMusic audioSrc="/videos/homepage-hero-new.mp3" />
    </main>
  );
}
