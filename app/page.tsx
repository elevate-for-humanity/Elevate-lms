export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import MarqueeBanner from '@/components/MarqueeBanner';
import HomeHero from '@/components/home/HomeHero';

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
  { label: 'Healthcare', title: 'CNA & Medical Assistant', desc: 'Indiana state CNA certification. NHA CCMA. Clinical rotations included. WIOA funded.', img: '/images/pages/card-cna.jpg', href: '/programs/cna', salary: '$30K–$42K', tag: 'Healthcare', position: 'center top' },
  { label: 'Skilled Trades', title: 'HVAC, Welding & Electrical', desc: 'EPA 608, AWS, NCCER credentials. Hands-on lab. Tools provided. Trades pay $45K–$75K.', img: '/images/pages/card-hvac.jpg', href: '/programs?category=trades', salary: '$45K–$75K', tag: 'Trades', position: 'center center' },
  { label: 'Transportation', title: 'CDL Class A', desc: 'Pre-trip, backing, road skills. Indiana freight industry needs drivers now.', img: '/images/pages/card-cdl.jpg', href: '/programs/cdl-training', salary: '$55K–$80K', tag: 'CDL', position: 'center center' },
  { label: 'Barbering', title: 'Barber Apprenticeship', desc: 'DOL Registered Apprenticeship. Earn while you learn. Indiana Barber License on completion.', img: '/images/pages/card-barber.jpg', href: '/programs/barber-apprenticeship', salary: '$35K–$60K', tag: 'Apprenticeship', position: 'center top' },
  { label: 'Business', title: 'Bookkeeping & Business', desc: 'QuickBooks, payroll, financial statements. Launch a business or land a finance role.', img: '/images/pages/card-business.jpg', href: '/programs?category=business', salary: '$38K–$55K', tag: 'Business', position: 'center center' },
  { label: 'Safety', title: 'CPR & First Aid', desc: 'Live instructor. Mannequin shipped to your door. Certified same day. Free with enrollment.', img: '/images/pages/card-cpr.jpg', href: '/programs/cpr-first-aid', salary: 'Required credential', tag: 'Certification', position: 'center center' },
];

const FUNDING = [
  { tag: 'Federal', name: 'WIOA', desc: 'Covers tuition, books, tools, and exam fees for eligible adults, dislocated workers, and youth 16–24.' },
  { tag: 'Indiana State', name: 'Workforce Ready Grant', desc: 'Indiana state grant covering high-demand certification programs at no cost for eligible participants.' },
  { tag: 'Indiana State', name: 'JRI — Job Ready Indy', desc: 'Funded career training for eligible justice-involved individuals through Indiana DWD.' },
  { tag: 'Federal', name: 'DOL Apprenticeship', desc: 'Earn wages from day one while completing your apprenticeship hours. No tuition cost.' },
];

const EMPLOYER_PROPS = [
  { icon: '🎓', title: 'Pre-screened graduates', desc: 'Credentialed, job-ready candidates from our programs — vetted before they reach your door.' },
  { icon: '💰', title: 'WOTC tax credits', desc: 'Work Opportunity Tax Credits for hiring eligible Elevate graduates. We handle the paperwork.' },
  { icon: '🔄', title: 'OJT reimbursement', desc: 'On-the-job training wage reimbursement through WIOA — up to 50% of wages during training.' },
  { icon: '📋', title: 'WIOA compliance', desc: 'Full compliance reporting, documentation, and case management built in.' },
];

const STATS = [
  { value: '500+', label: 'Graduates Trained', sub: 'and counting' },
  { value: '30+', label: 'Employer Partners', sub: 'active hiring' },
  { value: '15+', label: 'Credentials Offered', sub: 'nationally recognized' },
  { value: '$0', label: 'Cost to Eligible Participants', sub: 'WIOA & state funded' },
];

const TESTIMONIALS = [
  { quote: "WIOA paid for my Medical Assistant training, and I started working right after graduation. Now I'm making $42,000 a year with full benefits.", name: 'Sarah M.', program: 'Medical Assistant', salary: '$42K/yr', photo: '/images/testimonials-hq/person-1.jpg' },
  { quote: 'They provided an extremely informative and hospitable environment. I really enjoyed my classes. The staff made everything easy to understand.', name: 'Timothy S.', program: 'CDL Training', salary: '$55K/yr', photo: '/images/testimonials-hq/person-4.jpg' },
  { quote: 'Anyone who wants to grow and make more money should try Elevate. You deserve it. The staff is amazing and easy to communicate with.', name: 'Jasmine R.', program: 'CNA Certification', salary: '$38K/yr', photo: '/images/testimonials-hq/person-3.jpg' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* HERO */}
      <HomeHero />

      {/* ROTATING MARQUEE */}
      <MarqueeBanner />

      {/* WHO WE ARE */}
      <section className="bg-white py-20 px-6 border-b-4 border-brand-red-600">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-3">Who We Are</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-5">
              Indianapolis&apos; workforce training platform — built for adults who need real results fast.
            </h2>
            <p className="text-slate-600 text-base leading-relaxed mb-5">
              Elevate for Humanity is a DOL Registered Apprenticeship Sponsor and ETPL-approved training provider serving Indiana adults. We run short-term, credential-bearing programs in healthcare, skilled trades, CDL, barbering, and business — most available at <strong>zero cost</strong> to eligible participants through WIOA and state funding.
            </p>
            <p className="text-slate-600 text-base leading-relaxed mb-8">
              We work directly with WorkOne, Indiana DWD, and employer partners to connect graduates with jobs — not just certificates.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/about" className="bg-slate-900 text-white font-bold px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors text-sm">About Elevate</Link>
              <Link href="/wioa-eligibility" className="border border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors text-sm">Check My Eligibility</Link>
            </div>
          </div>
          <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden shadow-xl">
            <Image src="/images/pages/section-success.jpg" alt="Elevate for Humanity graduates" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      {/* WHO WE HELP */}
      <section className="bg-slate-950 py-20 px-6 border-b-4 border-brand-red-600">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3 text-center">Who We Help</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4 text-center">
            We train adults who are ready to change their lives.
          </h2>
          <p className="text-slate-400 text-base text-center mb-12 max-w-2xl mx-auto">
            Our programs are designed for working adults, career changers, justice-involved individuals, and anyone who needs a faster path to a living wage.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { img: '/images/pages/card-adult.jpg', title: 'Working Adults', desc: 'Evening and weekend scheduling. Train without quitting your current job.' },
              { img: '/images/pages/card-career.jpg', title: 'Career Changers', desc: 'Switch industries in weeks. Credentials that employers recognize immediately.' },
              { img: '/images/pages/card-wioa.jpg', title: 'WIOA-Eligible Participants', desc: 'Dislocated workers, low-income adults, and youth 16–24 may qualify for fully funded training.' },
              { img: '/images/pages/card-justice.jpg', title: 'Justice-Involved Individuals', desc: 'JRI and reentry programs. We partner with Indiana DWD to remove barriers to employment.' },
            ].map((card) => (
              <div key={card.title} className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                <div style={{ height: '160px', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.img} alt={card.title} loading="lazy" className="w-full h-full object-cover" style={{ display: 'block' }} />
                </div>
                <div className="p-5">
                  <h3 className="text-white font-bold text-base mb-2">{card.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section className="bg-white py-20 px-6 border-b-4 border-slate-200">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-3">Programs</p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight max-w-xl">
              Six career tracks. Weeks to complete. Real credentials.
            </h2>
            <Link href="/programs" className="flex-shrink-0 border border-slate-300 text-slate-700 font-semibold px-5 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-sm">
              View All Programs →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROGRAMS.map((p) => (
              <Link key={p.title} href={p.href} className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-brand-red-300 transition-all">
                {/* Image — fixed 200px height, never overflows into text */}
                <div className="relative flex-shrink-0 overflow-hidden" style={{ height: '200px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.img}
                    alt={p.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-slate-900/80 text-white text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded backdrop-blur-sm">{p.tag}</span>
                  </div>
                </div>
                {/* Text — always below image, never clipped */}
                <div className="flex flex-col flex-1 p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-1">{p.label}</p>
                  <h3 className="text-slate-900 font-extrabold text-lg mb-2 leading-tight">{p.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">{p.desc}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-brand-green-700 font-bold text-xs bg-brand-green-50 px-2.5 py-1 rounded-full">{p.salary}</span>
                    <span className="text-brand-red-600 text-sm font-semibold group-hover:underline">Learn more →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <div className="bg-brand-red-700 border-y-4 border-brand-red-800 py-14 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((m) => (
            <div key={m.label}>
              <div className="text-4xl sm:text-5xl font-black text-white mb-1">{m.value}</div>
              <div className="text-sm font-semibold text-brand-red-100 mb-0.5">{m.label}</div>
              <div className="text-xs text-brand-red-200">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FUNDING */}
      <section className="bg-slate-950 py-20 px-6 border-b-4 border-brand-red-600">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">Funding</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4 max-w-2xl">
            Most participants pay $0 for training.
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-2xl">
            Federal and Indiana state workforce funding covers tuition, books, tools, and certification exam fees for eligible participants. We help you navigate every option.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {FUNDING.map((f) => (
              <div key={f.name} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-1">{f.tag}</p>
                <h3 className="text-white font-bold text-base mb-2">{f.name}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/wioa-eligibility" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors">Check My Eligibility</Link>
            <Link href="/funding" className="border border-white/30 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors">All Funding Options</Link>
          </div>
        </div>
      </section>

      {/* EMPLOYER & PARTNER */}
      <section className="bg-white py-20 px-6 border-b-4 border-slate-200">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden shadow-xl order-2 lg:order-1">
            <Image src="/images/pages/section-employer.jpg" alt="Employer partnership" fill loading="lazy" className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-3">For Employers &amp; Partners</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-5">
              Hire credentialed graduates. Reduce your cost to hire.
            </h2>
            <p className="text-slate-600 text-base leading-relaxed mb-8">
              Elevate partners with Indiana employers to fill open roles with trained, credentialed graduates — while leveraging WOTC credits, OJT reimbursement, and WIOA compliance support.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {EMPLOYER_PROPS.map((ep) => (
                <div key={ep.title} className="flex gap-3">
                  <span className="text-2xl flex-shrink-0">{ep.icon}</span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm mb-0.5">{ep.title}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{ep.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/for-employers" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm">Employer Portal</Link>
              <Link href="/partner-portal" className="border border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors text-sm">Become a Partner</Link>
              <Link href="/workforce-board" className="border border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors text-sm">Workforce Board</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CREDENTIALS */}
      <section className="bg-slate-950 py-20 px-6 border-b-4 border-brand-red-600">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">Credentials &amp; Certifications</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-5">
              Nationally recognized credentials — not just a certificate of completion.
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-6">
              Every Elevate program ends with a credential that employers recognize and regulators accept. EPA 608, AWS, NCCER, NHA CCMA, Indiana State CNA, Indiana Barber License, CDL Class A, CPR/AED — all issued through accredited testing bodies.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {['EPA 608 Universal','AWS Welding','NCCER Core','NHA CCMA','Indiana State CNA','Indiana Barber License','CDL Class A','CPR / AED'].map((c) => (
                <div key={c} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                  {c}
                </div>
              ))}
            </div>
            <Link href="/credentials" className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors">
              View All Credentials
            </Link>
          </div>
          <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden shadow-xl">
            <Image src="/images/pages/section-credentials.jpg" alt="Elevate credentials and certifications" fill loading="lazy" className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      {/* DRUG TESTING */}
      <section className="bg-white py-20 px-6 border-b-4 border-slate-200">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden shadow-xl order-2 lg:order-1">
            <Image src="/images/pages/section-drug-testing.jpg" alt="Drug testing services" fill loading="lazy" className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-3">Drug Testing</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-5">
              DOT-compliant drug testing for employers and participants.
            </h2>
            <p className="text-slate-600 text-base leading-relaxed mb-6">
              Elevate provides on-site and scheduled drug testing services for employers, program participants, and workforce agencies. DOT-compliant panels, rapid results, and full chain-of-custody documentation.
            </p>
            <ul className="space-y-2 mb-8">
              {['5-panel, 10-panel, and DOT panels','Rapid results — same day','Chain-of-custody documentation','Available for employers and individuals','Pre-employment, random, and post-incident'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/drug-testing" className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors">
              Drug Testing Services
            </Link>
          </div>
        </div>
      </section>

      {/* PARTNERING */}
      <section className="bg-slate-950 py-20 px-6 border-b-4 border-brand-red-600">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">Partner With Us</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-5">
              Workforce agencies, schools, and community organizations — let&apos;s build together.
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-6">
              Elevate partners with WorkOne centers, community colleges, reentry programs, housing authorities, and faith-based organizations to deliver training where people need it most. We bring the curriculum, credentials, and compliance — you bring the community.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {['WorkOne / DWD','Community Colleges','Reentry Programs','Housing Authorities','Faith-Based Orgs','Employer Consortiums','Workforce Boards','Case Management Agencies'].map((p) => (
                <div key={p} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                  {p}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/partner-portal" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors">
                Become a Partner
              </Link>
              <Link href="/workforce-board" className="border border-white/20 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors">
                Workforce Board
              </Link>
            </div>
          </div>
          <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden shadow-xl">
            <Image src="/images/pages/section-partners.jpg" alt="Elevate community partners" fill loading="lazy" className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-slate-50 py-20 px-6 border-b-4 border-slate-200">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">Student Outcomes</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-10">Real students. Real results.</h2>
          <div className="divide-y divide-slate-200">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="flex flex-col sm:flex-row gap-6 py-8">
                <Image src={t.photo} alt={t.name} width={64} height={64} className="rounded-full object-cover w-16 h-16 flex-shrink-0" />
                <div>
                  <div className="flex gap-0.5 mb-3">{[1,2,3,4,5].map((s) => <span key={s} className="text-amber-400 text-sm">★</span>)}</div>
                  <p className="text-slate-700 leading-relaxed mb-3">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                    <span className="text-slate-400">·</span>
                    <p className="text-slate-500 text-sm">{t.program}</p>
                    <span className="text-brand-green-700 font-bold text-xs bg-brand-green-50 px-2.5 py-1 rounded-full">{t.salary}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <div className="bg-slate-900 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-4">Get Started</p>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
            Your career starts here.<br className="hidden sm:block" /> Apply in minutes.
          </h2>
          <p className="text-slate-300 text-lg mb-10 leading-relaxed max-w-xl mx-auto">
            Training may be fully funded. Graduate with a nationally recognized credential and a job offer.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/wioa-eligibility" className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-4 rounded-lg font-bold text-lg transition-colors">
              Start Here — It&apos;s Free
            </Link>
            <Link href="/programs" className="border border-slate-600 text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-slate-800 transition-colors">
              View Programs
            </Link>
          </div>
        </div>
      </div>

    </main>
  );
}
