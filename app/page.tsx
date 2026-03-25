export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import MarqueeBanner from '@/components/MarqueeBanner';
import { BlurIn } from '@/components/animations/PremiumAnimations';

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

      {/* ── SECTION 1: HERO ── */}
      <section className="grid lg:grid-cols-2">
        <div className="relative h-72 sm:h-96 lg:h-auto min-h-[520px] overflow-hidden bg-slate-900">
          <video src="/videos/barber-hero.mp4"
            autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div className="bg-slate-900 flex items-center">
          <div className="px-8 py-12 lg:px-14 lg:py-16 max-w-xl w-full">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">Indianapolis, Indiana</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              Get certified, funded, and hired in 4–12 weeks.
            </h1>
            <p className="text-slate-300 text-base leading-relaxed mb-8 max-w-xl">
              No tuition for eligible applicants. Workforce training aligned with real employers — healthcare, trades, CDL, tech, and more.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/check-eligibility" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-base">
                Check Eligibility
              </Link>
              <Link href="/programs" className="border border-white/20 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-base">
                See All Programs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: AUDIENCE SPLIT ── */}
      <section className="bg-white border-b border-slate-200 py-14 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-3">Choose your path</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-10">Who are you here for?</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="flex flex-col rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="relative h-44 bg-slate-900">
                <Image src="/images/pages/cna-patient-care.jpg" alt="Get Training" fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                <div className="absolute inset-0 bg-slate-900/40" />
                <span className="absolute bottom-3 left-4 text-white font-extrabold text-lg">Get Training</span>
              </div>
              <div className="flex flex-col flex-1 p-6 bg-white">
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">Short-term programs with real credentials. Funding available for eligible Indiana residents.</p>
                <Link href="/students" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm text-center">
                  Start Here
                </Link>
              </div>
            </div>
            <div className="flex flex-col rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="relative h-44 bg-slate-900">
                <Image src="/images/pages/office-administration.jpg" alt="Hire Talent" fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                <div className="absolute inset-0 bg-slate-900/40" />
                <span className="absolute bottom-3 left-4 text-white font-extrabold text-lg">Hire Talent</span>
              </div>
              <div className="flex flex-col flex-1 p-6 bg-white">
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">Pre-screened graduates, WOTC credits, OJT reimbursement, and workforce compliance support.</p>
                <Link href="/employers" className="bg-slate-900 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm text-center">
                  Hire Graduates
                </Link>
              </div>
            </div>
            <div className="flex flex-col rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="relative h-44 bg-slate-900">
                <Image src="/images/pages/barber-apprenticeship.jpg" alt="Partner With Us" fill className="object-cover object-top" sizes="(max-width: 640px) 100vw, 33vw" />
                <div className="absolute inset-0 bg-slate-900/40" />
                <span className="absolute bottom-3 left-4 text-white font-extrabold text-lg">Partner With Us</span>
              </div>
              <div className="flex flex-col flex-1 p-6 bg-white">
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">Workforce boards, nonprofits, and employers — align your programs with our ETPL and DOL network.</p>
                <Link href="/partners" className="bg-brand-blue-700 hover:bg-brand-blue-800 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm text-center">
                  Become a Partner
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: HOW IT WORKS ── */}
      <section className="bg-slate-950 py-16 sm:py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3 text-center">Simple process</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-12 text-center">How it works</h2>
          <div className="grid sm:grid-cols-5 gap-4">
            {[
              { step: '1', label: 'Apply', sub: '5 minutes online' },
              { step: '2', label: 'Get Approved for Funding', sub: 'WIOA, WRG, or self-pay' },
              { step: '3', label: 'Start Training', sub: 'In-person or hybrid' },
              { step: '4', label: 'Earn Your Credential', sub: 'Nationally recognized' },
              { step: '5', label: 'Get Placed', sub: 'Employer network ready' },
            ].map((s, i) => (
              <div key={s.step} className="flex flex-col items-center text-center relative">
                <div className="w-12 h-12 rounded-full bg-brand-red-600 text-white font-black text-lg flex items-center justify-center mb-3 flex-shrink-0">
                  {s.step}
                </div>
                {i < 4 && (
                  <div className="hidden sm:block absolute top-6 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-px bg-slate-700" />
                )}
                <p className="text-white font-bold text-sm mb-1">{s.label}</p>
                <p className="text-slate-500 text-xs">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/check-eligibility" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-10 py-4 rounded-lg transition-colors text-base inline-block">
              Check My Eligibility — It&apos;s Free
            </Link>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <MarqueeBanner />

      {/* ── SECTION 4: PROGRAM OUTCOMES ── */}
      <section className="bg-white py-16 sm:py-20 px-6 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-3 text-center">Real outcomes</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 text-center">Programs that pay off</h2>
          <p className="text-slate-500 text-sm text-center mb-12 max-w-xl mx-auto">Every program ends with a nationally recognized credential and a clear path to employment.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { name: 'CNA — Certified Nursing Assistant', duration: '4–8 weeks', credential: 'CNA Certification', salary: '$28–$42K/yr', growth: '+8% job growth', color: 'border-brand-blue-500', tag: 'Healthcare', img: '/images/pages/cna-nursing-real.jpg', href: '/programs/cna-cert' },
              { name: 'HVAC Technician', duration: '12 weeks', credential: 'EPA 608 Universal, OSHA 30', salary: '$40–$80K/yr', growth: 'High demand statewide', color: 'border-brand-orange-500', tag: 'Skilled Trades', img: '/images/pages/hvac-technician.jpg', href: '/programs/hvac-technician' },
              { name: 'CDL Class A', duration: 'Weeks, not years', credential: 'CDL Class A License', salary: '$50–$80K/yr', growth: 'Sign-on bonuses available', color: 'border-brand-red-500', tag: 'Transportation', img: '/images/pages/cdl-truck-highway.jpg', href: '/programs/cdl-class-a' },
              { name: 'Barber Apprenticeship', duration: '15–17 months', credential: 'Indiana Barber License', salary: '$35–$65K+/yr', growth: 'Earn while you train', color: 'border-brand-green-500', tag: 'Apprenticeship', img: '/images/pages/barber-cutting.jpg', href: '/programs/barber-apprenticeship' },
              { name: 'Phlebotomy Technician', duration: '6 weeks', credential: 'CPT (NHA), CPR', salary: '$32–$42K/yr', growth: 'ETPL approved', color: 'border-brand-blue-500', tag: 'Healthcare', img: '/images/pages/cpr-training-real.jpg', href: '/programs/phlebotomy-technician' },
              { name: 'IT Help Desk Technician', duration: '8 weeks', credential: 'Certiport IT Specialist', salary: '$38–$55K/yr', growth: 'Remote-friendly roles', color: 'border-slate-500', tag: 'Technology', img: '/images/pages/network-administration.jpg', href: '/programs/it-help-desk' },
            ].map((prog) => (
              <div key={prog.name} className={`border-t-4 ${prog.color} bg-white rounded-xl overflow-hidden shadow-sm flex flex-col`}>
                <div className="relative h-40 bg-slate-200">
                  <Image src={prog.img} alt={prog.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{prog.tag}</span>
                  <h3 className="font-extrabold text-slate-900 text-base mb-4 leading-snug">{prog.name}</h3>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 text-sm text-slate-600"><span className="text-slate-400">⏱</span> {prog.duration}</div>
                    <div className="flex items-center gap-2 text-sm text-slate-600"><span className="text-slate-400">🎓</span> {prog.credential}</div>
                    <div className="flex items-center gap-2 text-sm font-bold text-brand-green-700"><span>💰</span> {prog.salary}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500"><span>📈</span> {prog.growth}</div>
                  </div>
                  <Link href={prog.href} className="mt-5 text-brand-red-600 hover:text-brand-red-700 font-bold text-sm">
                    View program →
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/programs" className="border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm inline-block">
              See All 20+ Programs
            </Link>
          </div>
        </div>
      </section>

      {/* ── CDL FULL-BLEED VIDEO ── */}
      <section className="border-t border-slate-200">
        <div className="relative w-full overflow-hidden bg-slate-900" style={{ height: 'clamp(320px, 42vw, 580px)' }}>
          <video src="/videos/cdl-hero.mp4"
            autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute bottom-4 left-4">
            <span className="bg-slate-900/80 text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded backdrop-blur-sm">CDL Training</span>
          </div>
        </div>
        <div className="bg-slate-900 px-6 py-12 sm:py-16">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">Commercial Driver&apos;s License</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-4 max-w-2xl">CDL Class A — $55K–$80K Starting. Training in Weeks.</h2>
            <p className="text-slate-300 text-base leading-relaxed mb-8 max-w-2xl">Indiana&apos;s freight and logistics industry needs drivers now. Elevate&apos;s CDL program covers pre-trip inspection, backing maneuvers, and road skills — everything you need to pass the CDL skills test and start earning.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/programs/cdl-class-a" className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-6 py-3 rounded-lg transition-colors text-sm">See CDL Program</Link>
              <Link href="/check-eligibility" className="border border-white/20 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-lg transition-colors text-sm">Check Funding</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: CREDIBILITY ── */}
      <section className="bg-white border-t border-slate-100 py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-3 text-center">Verified credentials</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 text-center">Backed by the institutions that matter</h2>
          <p className="text-slate-500 text-sm text-center mb-12 max-w-xl mx-auto">Our programs are approved, registered, and recognized by federal and state workforce agencies.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'DOL Registered Apprenticeship Sponsor', desc: 'U.S. Department of Labor — official registered apprenticeship programs with earn-while-you-learn structure.', icon: '🏛️' },
              { title: 'Indiana ETPL Certified Provider', desc: 'Indiana DWD Eligible Training Provider List — programs eligible for WIOA and Workforce Ready Grant funding.', icon: '📋' },
              { title: 'Government Contractor & State Bidder', desc: 'Approved state bidder and government contractor for workforce and vocational training services.', icon: '📜' },
              { title: 'Certiport Authorized Testing Center', desc: 'Official testing site for Microsoft, CompTIA, and IT Specialist certifications.', icon: '💻' },
              { title: 'IRS VITA Certified Site', desc: 'IRS-certified Volunteer Income Tax Assistance site — free tax prep and financial services training.', icon: '💼' },
              { title: 'EmployIndy Workforce Partner', desc: 'Aligned with Indianapolis workforce development ecosystem for employer connections and job placement.', icon: '🤝' },
            ].map((c) => (
              <div key={c.title} className="flex items-start gap-4 bg-slate-50 border border-slate-200 rounded-xl p-5">
                <span className="text-2xl flex-shrink-0">{c.icon}</span>
                <div>
                  <p className="font-bold text-slate-900 text-sm mb-1">{c.title}</p>
                  <p className="text-slate-500 text-xs leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SKILLED TRADES VIDEO ── */}
      <section className="grid lg:grid-cols-2 border-t border-slate-800">
        <div className="bg-slate-900 flex items-center order-2 lg:order-1">
          <div className="px-8 py-12 lg:px-14 lg:py-16 max-w-xl w-full">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">Skilled Trades</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-4">HVAC, Welding, Electrical — Hands-On Training, Real Credentials</h2>
            <p className="text-slate-300 text-base leading-relaxed mb-6">Trades jobs pay $45K–$75K starting. Elevate&apos;s programs combine classroom instruction, hands-on lab work, and nationally recognized credentials — EPA 608, AWS, NCCER — in weeks, not years.</p>
            <ul className="space-y-2 mb-8">
              {['HVAC Technician — EPA 608 certified', 'Welding — AWS D1.1 structural certification', 'Electrical — NCCER Core + Level 1', 'All tools and safety gear provided'].map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />{b}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href="/programs?category=trades" className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-6 py-3 rounded-lg transition-colors text-sm">See Trades Programs</Link>
              <Link href="/credentials" className="border border-white/20 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-lg transition-colors text-sm">View Credentials</Link>
            </div>
          </div>
        </div>
        <div className="relative h-72 sm:h-96 lg:h-auto min-h-[460px] overflow-hidden bg-slate-900 order-1 lg:order-2">
          <video src="/videos/electrician-trades.mp4"
            autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
        </div>
      </section>

      {/* ── FUNDING ── */}
      <div className="bg-brand-red-700 border-t border-brand-red-800 py-14 sm:py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-200 font-bold text-xs uppercase tracking-widest mb-3">Funding</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Most participants pay $0 for training</h2>
          <p className="text-brand-red-100 leading-relaxed mb-10 max-w-2xl">Federal and Indiana state workforce funding covers tuition, books, tools, and certification exam fees for eligible participants.</p>
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              { label: 'WIOA', tag: 'Federal', desc: 'Covers tuition, books, tools, and exam fees for eligible adults, dislocated workers, and youth 16–24.' },
              { label: 'Workforce Ready Grant', tag: 'Indiana State', desc: 'Indiana state grant covering high-demand certification programs at no cost for eligible participants.' },
              { label: 'JRI — Job Ready Indy', tag: 'Indiana State', desc: 'Funded career training for eligible justice-involved individuals through Indiana DWD.' },
            ].map((f) => (
              <div key={f.label} className="bg-white/10 rounded-xl p-6">
                <p className="text-brand-red-200 text-xs font-bold uppercase tracking-widest mb-1">{f.tag}</p>
                <h3 className="text-white font-bold text-base mb-2">{f.label}</h3>
                <p className="text-brand-red-100 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/check-eligibility" className="bg-white text-brand-red-700 font-bold px-8 py-3.5 rounded-lg hover:bg-brand-red-50 transition-colors">Check My Eligibility</Link>
            <Link href="/funding" className="border border-white/40 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors">All Funding Options</Link>
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div className="bg-white border-t border-slate-100 py-16 sm:py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">Student Outcomes</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-10">Real students. Real results.</h2>
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
      </div>

      {/* ── EMPLOYER STRIP ── */}
      <div className="bg-slate-50 border-t border-slate-200 py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">For Employers &amp; Agencies</p>
            <p className="text-slate-700 text-sm max-w-md">Pre-screened graduates, WOTC credits, OJT reimbursement, and WIOA compliance reporting — all in one place.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link href="/employers" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-5 py-2.5 rounded-lg transition-colors text-sm">Hire Graduates</Link>
            <Link href="/workforce-board" className="border border-slate-300 text-slate-700 font-semibold px-5 py-2.5 rounded-lg hover:bg-white transition-colors text-sm">Workforce Board</Link>
          </div>
        </div>
      </div>

      {/* ── SECTION 6: FINAL CTA ── */}
      <div className="bg-slate-900 border-t border-slate-800 py-20 sm:py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <BlurIn>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Start your application now.</h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed max-w-xl mx-auto">
              Apply in 5 minutes. Training may be fully funded. Graduate with a nationally recognized credential and a job offer.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/check-eligibility" className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-4 rounded-lg font-bold text-lg transition-colors">
                Check Eligibility — It&apos;s Free
              </Link>
              <Link href="/programs" className="border border-slate-600 text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-slate-800 transition-colors">
                View Programs
              </Link>
            </div>
          </BlurIn>
        </div>
      </div>

    </main>
  );
}
