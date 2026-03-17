export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Briefcase, DollarSign, Clock, Award, CheckCircle, ExternalLink, CreditCard, Phone } from 'lucide-react';
import { ALL_PROGRAMS, SECTORS } from '@/data/programs/catalog';
import PageVideoHero from '@/components/ui/PageVideoHero';
import CatalogFilters from './CatalogFilters';

export const metadata: Metadata = {
  title: 'Credential Pathways | Funded Career Training Programs',
  description:
    'Credential pathway programs in healthcare, skilled trades, technology, CDL, barbering, and business. Each pathway includes nationally recognized certifications. Training may be fully funded through WIOA and state workforce programs.',
  alternates: { canonical: '/programs' },
};

export default function ProgramCatalogPage() {
  const catalogData = ALL_PROGRAMS.map((p) => ({
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle,
    sector: p.sector,
    heroImage: p.heroImage,
    heroImageAlt: p.heroImageAlt,
    deliveryMode: p.deliveryMode,
    durationWeeks: p.durationWeeks,
    badge: p.badge ?? null,
    badgeColor: (p.badgeColor ?? null) as string | null,
    isSelfPay: p.isSelfPay ?? false,
    credentials: p.credentials.map((c) => c.name),
    entryJob: p.careerPathway?.[0]?.title ?? null,
    entrySalary: p.careerPathway?.[0]?.salaryRange ?? null,
  }));

  const totalCredentials = ALL_PROGRAMS.reduce((s, p) => s + p.credentials.length, 0);
  const totalSectors = new Set(ALL_PROGRAMS.map((p) => p.sector)).size;
  const totalPartners = new Set(ALL_PROGRAMS.flatMap((p) => p.employerPartners)).size;

  return (
    <div className="min-h-screen bg-white">
      <PageVideoHero
        videoSrc="/videos/training-providers-hero.mp4"
        posterSrc="/images/pages/programs-hero.jpg"
        posterAlt="Workforce training programs — trades, healthcare, technology"
        size="primary"
      />

      {/* Page header */}
      <div className="bg-white border-b border-slate-200 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900 font-medium">Programs</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Credential Pathways</h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            Industry-recognized credentials. Competency-based training. Workforce-funded pathways to employment.
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <section className="bg-white py-5 border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm text-slate-900">
            <span><strong className="text-brand-blue-400">{ALL_PROGRAMS.length}</strong> Programs</span>
            <span><strong className="text-brand-blue-400">{totalCredentials}</strong> Industry Credentials</span>
            <span><strong className="text-brand-blue-400">{totalSectors}</strong> Sectors</span>
            <span><strong className="text-brand-blue-400">{totalPartners}</strong> Employer Partners</span>
            <span><strong className="text-brand-green-400">$0</strong> with WIOA Funding</span>
          </div>
        </div>
      </section>

      {/* ── OJT / EARN WHILE YOU LEARN ── */}
      <section className="bg-slate-50 border-b border-slate-200 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Section header */}
          <div className="mb-10">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Apprenticeship Pathways</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Earn While You Learn</h2>
            <p className="text-slate-600 max-w-2xl leading-relaxed">
              Not every program starts in a classroom. Apprenticeship pathways put you to work from day one — earning wages while you complete your required training hours toward a state license or nationally recognized credential.
            </p>
          </div>

          {/* What is OJT */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              {
                icon: <DollarSign className="w-5 h-5 text-brand-green-600" />,
                title: 'Paid from Day One',
                desc: 'Apprentices are employees of the host business. You earn wages — and sometimes tips and commission — while completing your training hours.',
              },
              {
                icon: <Briefcase className="w-5 h-5 text-brand-blue-600" />,
                title: 'Real Work Environment',
                desc: 'Training happens in licensed shops, salons, and job sites — not just a classroom. You build a client base and professional reputation as you go.',
              },
              {
                icon: <Clock className="w-5 h-5 text-brand-red-600" />,
                title: 'Flexible Schedule',
                desc: 'OJT hours are logged at your host site on a schedule that works for you. Related Technical Instruction (RTI) is completed online.',
              },
              {
                icon: <Award className="w-5 h-5 text-slate-700" />,
                title: 'DOL Registered',
                desc: 'Elevate is a U.S. Department of Labor Registered Apprenticeship Sponsor (RAPIDS: 2025-IN-132301). Your credential is portable nationwide.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="mb-3">{icon}</div>
                <h3 className="font-bold text-slate-900 text-sm mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* How OJT works — step strip */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 mb-12">
            <h3 className="font-bold text-slate-900 text-base mb-6">How an apprenticeship works</h3>
            <div className="grid sm:grid-cols-4 gap-6">
              {[
                { num: '01', title: 'Apply & Interview', desc: 'Submit your application. We match you with a host shop or employer site near you.' },
                { num: '02', title: 'Sign Your Agreement', desc: 'You, Elevate, and the host employer sign a DOL-compliant apprenticeship agreement. Your wage rate is set upfront.' },
                { num: '03', title: 'Log OJT Hours', desc: 'Work your scheduled hours at the host site. Elevate tracks your progress and ensures you meet state and DOL requirements.' },
                { num: '04', title: 'Earn Your License', desc: 'Once you complete your required hours and pass the state exam, your license is issued by the Indiana Professional Licensing Agency.' },
              ].map((step) => (
                <div key={step.num} className="flex flex-col">
                  <span className="text-brand-red-600 font-extrabold text-xs uppercase tracking-widest mb-2">{step.num}</span>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{step.title}</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Apprenticeship program cards */}
          <h3 className="font-bold text-slate-900 text-base mb-5">Apprenticeship programs available now</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                title: 'Barber Apprenticeship',
                duration: '12–18 months',
                hours: '2,000 hrs (1,500 OJT + 500 RTI)',
                credential: 'Indiana Barber License',
                salary: '$24K–$60K+',
                note: 'Earn tips & commission during training',
                image: '/images/pages/barber-hero-main.jpg',
                href: '/programs/barber-apprenticeship',
              },
              {
                title: 'Cosmetology Apprenticeship',
                duration: '18 months',
                hours: '2,000 hrs supervised salon training',
                credential: 'Indiana Cosmetology License',
                salary: '$20K–$45K+',
                note: 'Paid employee of host salon from day one',
                image: '/images/pages/cosmetology.jpg',
                href: '/programs/cosmetology-apprenticeship',
              },
              {
                title: 'Nail Technician',
                duration: '6–9 months',
                hours: '600 hrs supervised training',
                credential: 'Indiana Manicurist License',
                salary: '$18K–$35K+',
                note: 'Fastest path to Indiana nail tech license',
                image: '/images/pages/nail-technician.jpg',
                href: '/programs/nail-technician-apprenticeship',
              },
              {
                title: 'Culinary Apprenticeship',
                duration: '12 months',
                hours: 'Professional kitchen OJT',
                credential: 'ServSafe + DOL Certificate',
                salary: '$28K–$45K+',
                note: 'Paid hourly at host restaurant or kitchen',
                image: '/images/pages/culinary.jpg',
                href: '/programs/culinary-apprenticeship',
              },
            ].map((p) => (
              <Link
                key={p.title}
                href={p.href}
                className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-brand-red-300 hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative h-36 flex-shrink-0">
                  <Image src={p.image} alt={p.title} fill sizes="300px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-2 left-3 text-white font-bold text-sm leading-tight">{p.title}</span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-brand-green-700 font-bold text-xs">{p.salary}</span>
                    <span className="text-slate-400 text-xs">{p.duration}</span>
                  </div>
                  <p className="text-slate-500 text-xs mb-1"><span className="font-semibold text-slate-700">Hours:</span> {p.hours}</p>
                  <p className="text-slate-500 text-xs mb-1"><span className="font-semibold text-slate-700">Credential:</span> {p.credential}</p>
                  <p className="text-brand-red-600 text-xs font-semibold mt-auto pt-2">{p.note}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* OJT for employers callout */}
          <div className="bg-brand-blue-700 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1">
              <p className="text-brand-blue-200 font-bold text-xs uppercase tracking-widest mb-1">For Employers</p>
              <h3 className="text-white font-extrabold text-lg mb-2">Sponsor an apprentice — get up to 50% wage reimbursement</h3>
              <p className="text-brand-blue-100 text-sm leading-relaxed">
                Businesses that host apprentices can receive OJT wage reimbursement through WIOA, plus WOTC tax credits up to $9,600 per qualifying hire. Elevate handles all DOL compliance and paperwork.
              </p>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Link href="/ojt-and-funding" className="bg-white text-brand-blue-700 font-bold px-6 py-3 rounded-lg text-sm hover:bg-brand-blue-50 transition-colors whitespace-nowrap">
                OJT & Employer Funding
              </Link>
              <Link href="/employer" className="border border-brand-blue-400 text-white font-semibold px-6 py-3 rounded-lg text-sm hover:border-white transition-colors whitespace-nowrap text-center">
                Employer Overview
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Client-side filter + card grid */}
      <CatalogFilters
        programs={catalogData}
        sectors={SECTORS as unknown as { key: string; label: string; description: string }[]}
      />


      {/* ── HOW FUNDING WORKS ── */}
      <section className="bg-slate-50 border-t border-slate-100 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="mb-10">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Paying for Training</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Most participants pay $0 for training</h2>
            <p className="text-slate-600 max-w-2xl leading-relaxed">
              Federal and Indiana state workforce funding covers tuition, books, tools, and exam fees for eligible participants. The first step is always a free WorkOne appointment — Indiana&apos;s workforce agency determines what you qualify for before you spend a dollar.
            </p>
          </div>

          {/* ── BLOCK 1: WorkOne / Funded path ── */}
          <div className="bg-brand-blue-700 rounded-2xl overflow-hidden mb-6">
            <div className="grid lg:grid-cols-2">
              {/* Photo */}
              <div className="relative h-64 lg:h-auto min-h-[320px]">
                <Image
                  src="/images/pages/wioa-meeting.jpg"
                  alt="WorkOne career counseling appointment"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-900/80 via-brand-blue-900/20 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <span className="inline-block bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-2">Step 1 — Start Here</span>
                  <p className="text-white font-extrabold text-xl leading-tight">Make an appointment with WorkOne</p>
                  <p className="text-brand-blue-200 text-xs mt-1">Free. No obligation. Required for most funded programs.</p>
                </div>
              </div>
              {/* Content */}
              <div className="p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <p className="text-brand-blue-100 text-sm leading-relaxed mb-6">
                    WorkOne is Indiana&apos;s free career and workforce services center. A case manager reviews your eligibility for WIOA, Workforce Ready Grant, and other state funding — at no cost to you. This appointment is required before Elevate can enroll you under most funded programs.
                  </p>
                  <div className="space-y-3 mb-6">
                    {[
                      { num: '1', title: 'Register at Indiana Career Connect', desc: 'Create a free account at in.gov/dwd/indiana-career-connect. Takes about 10 minutes.' },
                      { num: '2', title: 'Schedule your WorkOne appointment', desc: 'Call or walk in to your nearest WorkOne center. Bring a valid ID and proof of Indiana residency.' },
                      { num: '3', title: 'Meet with a case manager', desc: 'They review your eligibility for WIOA, grants, and other funding. Free — no obligation.' },
                      { num: '4', title: 'Receive your funding authorization', desc: 'WorkOne issues a training authorization. Bring it to Elevate and we handle enrollment.' },
                    ].map((s) => (
                      <div key={s.num} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-red-600 text-white text-xs font-bold flex items-center justify-center">{s.num}</span>
                        <div>
                          <p className="text-white font-semibold text-xs mb-0.5">{s.title}</p>
                          <p className="text-brand-blue-200 text-xs leading-relaxed">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a href="https://www.in.gov/dwd/indiana-career-connect/" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-brand-blue-700 font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-brand-blue-50 transition-colors">
                    Indiana Career Connect <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a href="https://www.in.gov/dwd/workone/" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-5 py-2.5 rounded-lg text-sm hover:border-white transition-colors">
                    Find a WorkOne Center <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Funding sources strip */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'WIOA Title I', tag: 'Federal', desc: 'Covers tuition, books, tools, and exam fees for eligible adults, dislocated workers, and youth 16–24.' },
              { label: 'Workforce Ready Grant', tag: 'Indiana State', desc: 'State grant for high-demand certifications in healthcare, IT, and skilled trades. No repayment required.' },
              { label: 'Next Level Jobs', tag: 'Indiana State', desc: 'Covers tuition for eligible Hoosiers in high-wage, high-demand fields. Applied at enrollment.' },
              { label: 'JRI Funding', tag: 'Justice Reinvestment', desc: 'Indiana DWD funding for justice-involved individuals. Covers training costs for eligible participants.' },
            ].map(({ label, tag, desc }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-slate-900 text-sm">{label}</span>
                  <span className="text-brand-blue-600 text-xs font-semibold bg-brand-blue-50 px-2 py-0.5 rounded-full">{tag}</span>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* ── BLOCK 2: BNPL / Don't qualify ── */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-6">
            <div className="grid lg:grid-cols-2">
              {/* Content */}
              <div className="p-6 sm:p-8 flex flex-col justify-between order-2 lg:order-1">
                <div>
                  <span className="inline-block bg-brand-orange-100 text-brand-orange-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3">If You Don&apos;t Qualify for Workforce Funding</span>
                  <h3 className="text-slate-900 font-extrabold text-xl mb-3">We have payment options — including Buy Now, Pay Later</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    Not everyone qualifies for WIOA or state grants — and that&apos;s okay. Elevate offers flexible self-pay options so funding eligibility is never a barrier to starting your career.
                  </p>
                  <div className="space-y-3 mb-6">
                    {[
                      {
                        icon: <CreditCard className="w-4 h-4 text-brand-orange-600" />,
                        title: 'Buy Now, Pay Later',
                        desc: 'Split your tuition into manageable monthly payments. No large upfront cost. Apply in minutes — no hard credit check required for most plans.',
                        highlight: true,
                      },
                      {
                        icon: <DollarSign className="w-4 h-4 text-slate-500" />,
                        title: 'Elevate Payment Plans',
                        desc: 'Work directly with Elevate to set up a payment schedule that fits your budget. Customized based on program length and your situation.',
                        highlight: false,
                      },
                      {
                        icon: <Briefcase className="w-4 h-4 text-slate-500" />,
                        title: 'Employer Sponsorship',
                        desc: 'Some employers pay for training in exchange for a post-graduation work commitment. Ask us about current employer partners.',
                        highlight: false,
                      },
                    ].map(({ icon, title, desc, highlight }) => (
                      <div key={title} className={`flex gap-3 rounded-xl p-3 border ${highlight ? 'border-brand-orange-200 bg-brand-orange-50' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="flex-shrink-0 mt-0.5">{icon}</div>
                        <div>
                          <p className={`font-bold text-sm mb-0.5 ${highlight ? 'text-brand-orange-700' : 'text-slate-900'}`}>{title}</p>
                          <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Link href="/contact"
                  className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-lg text-sm hover:bg-slate-700 transition-colors self-start">
                  <Phone className="w-4 h-4" /> Ask About Payment Options
                </Link>
              </div>
              {/* Photo */}
              <div className="relative h-64 lg:h-auto min-h-[320px] order-1 lg:order-2">
                <Image
                  src="/images/pages/funding-impact-2.jpg"
                  alt="Student reviewing payment options with an advisor"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50" />
                <div className="absolute bottom-5 left-5 right-5">
                  <p className="text-white font-bold text-base leading-tight">Funding eligibility is never a barrier to starting.</p>
                </div>
              </div>
            </div>
          </div>

          {/* What funding covers */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
            <h3 className="font-bold text-slate-900 text-base mb-5">What workforce funding typically covers</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { item: 'Tuition & instruction fees', covered: true },
                { item: 'Textbooks & course materials', covered: true },
                { item: 'Tools & safety equipment', covered: true },
                { item: 'Certification exam fees', covered: true },
                { item: 'Supportive services (transportation, childcare)', covered: true },
                { item: 'Background check fees', covered: false },
                { item: 'Drug screening (some programs)', covered: false },
                { item: 'Uniforms (varies by program)', covered: false },
              ].map(({ item, covered }) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${covered ? 'text-brand-green-600' : 'text-slate-300'}`} />
                  <span className={`text-xs leading-relaxed ${covered ? 'text-slate-700' : 'text-slate-400'}`}>{item}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4">Coverage varies by funding source and individual eligibility. Your WorkOne case manager will confirm what is covered for your specific situation.</p>
          </div>

        </div>
      </section>

      {/* ── 3-UP ACTION CTAs ── */}
      <section className="bg-white border-t border-slate-100 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Next Steps</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Choose how you want to start</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">

            {/* CTA 1 — Inquiry */}
            <div className="group rounded-2xl overflow-hidden border border-slate-200 hover:border-brand-blue-300 hover:shadow-lg transition-all flex flex-col">
              <div className="relative h-48 flex-shrink-0">
                <Image
                  src="/images/pages/career-counseling-page-1.jpg"
                  alt="Talk to an Elevate advisor"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                <span className="absolute top-3 left-3 bg-brand-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">Free Consultation</span>
                <p className="absolute bottom-3 left-4 right-4 text-white font-extrabold text-lg leading-tight">Have questions? Talk to us first.</p>
              </div>
              <div className="p-5 flex flex-col flex-1 bg-white">
                <p className="text-slate-600 text-sm leading-relaxed mb-5 flex-1">
                  Not sure which program fits your goals or schedule? Talk to an Elevate advisor before you apply. We&apos;ll help you figure out the right path — and whether you qualify for funded training.
                </p>
                <Link href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
                  <Phone className="w-4 h-4" /> Schedule a Free Call
                </Link>
              </div>
            </div>

            {/* CTA 2 — Apply */}
            <div className="group rounded-2xl overflow-hidden border border-slate-200 hover:border-brand-red-300 hover:shadow-lg transition-all flex flex-col">
              <div className="relative h-48 flex-shrink-0">
                <Image
                  src="/images/pages/apply-page-1.jpg"
                  alt="Apply to an Elevate program"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                <span className="absolute top-3 left-3 bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">Apply Now</span>
                <p className="absolute bottom-3 left-4 right-4 text-white font-extrabold text-lg leading-tight">Ready to enroll? Start your application.</p>
              </div>
              <div className="p-5 flex flex-col flex-1 bg-white">
                <p className="text-slate-600 text-sm leading-relaxed mb-5 flex-1">
                  Applications take about 5 minutes. Once submitted, an Elevate advisor will contact you within one business day to confirm your program, start date, and funding options.
                </p>
                <Link href="/start"
                  className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
                  Start Your Application
                </Link>
              </div>
            </div>

            {/* CTA 3 — BNPL */}
            <div className="group rounded-2xl overflow-hidden border border-slate-200 hover:border-brand-orange-300 hover:shadow-lg transition-all flex flex-col">
              <div className="relative h-48 flex-shrink-0">
                <Image
                  src="/images/pages/funding-impact-3.jpg"
                  alt="Buy Now Pay Later tuition financing"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                <span className="absolute top-3 left-3 bg-brand-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">Buy Now, Pay Later</span>
                <p className="absolute bottom-3 left-4 right-4 text-white font-extrabold text-lg leading-tight">Don&apos;t qualify for grants? We have options.</p>
              </div>
              <div className="p-5 flex flex-col flex-1 bg-white">
                <p className="text-slate-600 text-sm leading-relaxed mb-5 flex-1">
                  Split your tuition into monthly payments with no large upfront cost. Apply in minutes — no hard credit check required for most plans. Funding eligibility is never a barrier to starting.
                </p>
                <Link href="/contact?subject=bnpl"
                  className="inline-flex items-center justify-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
                  <CreditCard className="w-4 h-4" /> Ask About BNPL
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Also available */}
      <section className="bg-white border-t py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Also Available</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/programs/micro-programs" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-brand-blue-300 hover:text-brand-blue-700 transition-colors">
              Micro Programs &amp; Short Certifications
            </Link>
            <Link href="/programs/federal-funded" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-brand-blue-300 hover:text-brand-blue-700 transition-colors">
              Federally Funded Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Institutional footer */}
      <section className="bg-white border-t py-8">
        <div className="max-w-6xl mx-auto px-4 text-xs text-slate-500 space-y-2">
          <p>Elevate for Humanity is an ETPL-listed training provider. Programs are eligible for WIOA, Next Level Jobs, and Workforce Ready Grant funding through Indiana DWD and local workforce boards.</p>
          <p>Salary data sourced from the U.S. Bureau of Labor Statistics, Occupational Outlook Handbook (2024). Actual earnings vary by employer, location, experience, and market conditions.</p>
          <p>Credential requirements and exam formats are set by the issuing organizations and may change. Verify current requirements with the issuing body before enrollment.</p>
        </div>
      </section>
    </div>
  );
}
