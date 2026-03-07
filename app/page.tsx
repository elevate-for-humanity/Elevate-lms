import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

import HomeHeroVideo from './HomeHeroVideo';

export const metadata: Metadata = {
  title: 'Elevate for Humanity | Workforce Credential Institute — Healthcare, Trades, CDL & Technology',
  description: 'Indiana workforce credential institute. Industry-aligned training, nationally recognized certifications (EPA 608, OSHA, WorkKeys NCRC, Certiport), and employer placement partnerships. WIOA and state funding available.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ===== NOW ENROLLING BANNER ===== */}
      <div className="bg-brand-green-600 text-white py-2.5 text-center text-sm font-semibold tracking-wide">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-3 flex-wrap">
          <span>Now Enrolling — Funded Credential Pathway Programs</span>
          <Link href="/apply" className="inline-flex items-center gap-1 bg-white text-brand-green-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-brand-green-50 transition-colors">
            Check Eligibility →
          </Link>
        </div>
      </div>

      {/* ===== HERO VIDEO ===== */}
      <section className="relative w-full h-[55vh] sm:h-[65vh] md:h-[75vh] lg:h-[85vh] xl:h-[90vh] min-h-[320px] overflow-hidden">
        <HomeHeroVideo />
      </section>

      {/* ===== HERO CTA ===== */}
      <section className="bg-slate-900 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-brand-red-400 font-semibold text-sm uppercase tracking-wider mb-3">Workforce Credential Institute</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08]">
            Industry-Aligned Training.
            <span className="block text-brand-red-400 mt-1">Nationally Recognized Credentials.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed max-w-2xl mx-auto">
            Elevate for Humanity is a workforce credential institute delivering career pathway programs in healthcare, skilled trades, CDL, and technology — each aligned to employer demand and validated by national certifying bodies.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link href="/apply/student" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg text-base sm:text-lg transition-all shadow-lg shadow-brand-red-600/30">
              Apply Now
            </Link>
            <Link href="/programs" className="bg-white/15 border border-white/30 text-white font-bold px-8 py-3.5 rounded-lg text-base sm:text-lg hover:bg-white/25 transition-all">
              Credential Pathways
            </Link>
          </div>
        </div>
      </section>

      {/* ===== INSTITUTIONAL TRUST BAR ===== */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mb-4">Institutional Affiliations &amp; Workforce Alignment</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-blue-600 rounded-full" />
              <span>U.S. Department of Labor — Registered Apprenticeship Sponsor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-blue-600 rounded-full" />
              <span>Indiana DWD — ETPL Listed Training Provider</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-blue-600 rounded-full" />
              <span>WorkOne — Workforce Partner</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-blue-600 rounded-full" />
              <span>WIOA Title I — Approved Provider</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-green-600 rounded-full" />
              <span>Next Level Jobs — Workforce Ready Grant Eligible</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-slate-500">
            <span>EPA 608 Approved Proctor Testing Site</span>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm text-slate-700">
            <span><strong className="text-slate-900">8</strong> Training Programs</span>
            <span><strong className="text-slate-900">35+</strong> Industry Credentials</span>
            <span><strong className="text-slate-900">5</strong> Career Sectors</span>
            <span><strong className="text-slate-900">20+</strong> Employer Partners</span>
            <span className="text-brand-green-700 font-semibold">$0 Tuition with Approved Funding</span>
          </div>
        </div>
      </section>

      {/* ===== AUDIENCE QUICK LINKS ===== */}
      
      <section className="py-10 sm:py-12 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-3">
            How can we help you?
          </h2>
          <p className="text-center text-slate-600 mb-8 max-w-2xl mx-auto">
            Choose your path below. Each option takes you directly to the information you need — everything starts online.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: '/programs', label: 'I want to train', desc: 'Browse funded programs.', cta: 'Browse Programs', image: '/images/hp/train.jpg', alt: 'Students in a training classroom' },
              { href: '/funding', label: 'I need funding', desc: 'Check your eligibility.', cta: 'Check Eligibility', image: '/images/hp/funding.jpg', alt: 'Funding and financial aid' },
              { href: '/employer', label: "I'm an employer", desc: 'Hire credentialed graduates.', cta: 'Hire Graduates', image: '/images/hp/employer.jpg', alt: 'Employer partnership meeting' },
              { href: '/store', label: 'I run a school', desc: 'License the platform.', cta: 'Get Licensed', image: '/images/hp/school.jpg', alt: 'Training program office' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col bg-white rounded-xl border border-slate-200 hover:border-brand-red-400 hover:shadow-md transition-all group overflow-hidden"
              >
                <div className="relative h-24 sm:h-32">
                  <Image src={item.image} alt={item.alt} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-3 sm:p-4">
                  <span className="font-bold text-sm sm:text-base text-slate-900 block mb-0.5">{item.label}</span>
                  <span className="text-xs text-slate-500 block mb-2">{item.desc}</span>
                  <span className="text-brand-red-600 font-semibold text-xs group-hover:underline">
                    {item.cta} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      



      {/* ===== THREE PILLARS ===== */}
      
      <section aria-label="Three pillars" className="py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <p className="text-brand-red-600 font-bold text-sm mb-2 uppercase tracking-wide">Our Model</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">Three Pillars of Workforce Readiness</h2>
            <p className="text-base text-slate-700 max-w-3xl mx-auto">Every credential pathway is built on three pillars — trained, certified, and employed.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                title: 'Industry-Aligned Training',
                desc: 'Healthcare, Skilled Trades, CDL, Technology, and Barbering — each mapped to employer hiring requirements and national credentials.',
                href: '/programs',
                cta: 'View Programs',
                image: '/images/hp/choose-program.jpg',
              },
              {
                title: 'National Credential Validation',
                desc: 'EPA 608, OSHA 10/30, WorkKeys NCRC, Certiport, NRF RISE Up, and CPR/First Aid — proctored on-site at our authorized testing center.',
                href: '/credentials',
                cta: 'View Credentials',
                image: '/images/hp/complete-training.jpg',
              },
              {
                title: 'Employer Placement',
                desc: 'Direct hiring pipelines with Indiana employers. WOTC tax credits, OJT wage reimbursement, and Registered Apprenticeship pathways.',
                href: '/employer',
                cta: 'Employer Info',
                image: '/images/hp/candidates.jpg',
              },
            ].map((pillar) => (
              <div key={pillar.title} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <Image src={pillar.image} alt={pillar.title} width={600} height={400} sizes="(max-width: 768px) 100vw, 33vw" className="w-full aspect-[3/2] object-cover" />
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5">{pillar.title}</h3>
                  <p className="text-slate-600 text-sm mb-4">{pillar.desc}</p>
                  <Link href={pillar.href} className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
                    {pillar.cta} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      


      



      {/* ===== NATIONAL CREDENTIAL VALIDATION ===== */}
      
      <section aria-label="National credential validation" className="py-10 sm:py-14 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <p className="text-brand-red-600 font-bold text-sm mb-2 uppercase tracking-wide">Credential Validation</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Workforce Readiness &amp; National Credential Validation</h2>
              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                Elevate operates as an authorized testing center for multiple national certifying bodies. Credentials are proctored on-site and issued by the certifying organization — not by Elevate. This ensures every graduate holds credentials that are portable, verifiable, and recognized by employers nationwide.
              </p>
              <p className="text-base text-slate-600 leading-relaxed mb-6">
                WorkKeys assessments and the National Career Readiness Certificate (NCRC) validate foundational workplace skills across all career pathways — supporting the institute, not replacing the industry-specific credentials earned in each program.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8 lg:mt-0">
              {[
                { name: 'ACT WorkKeys / NCRC', issuer: 'ACT, Inc.', desc: 'Workplace math, reading, and data skills. Bronze/Silver/Gold/Platinum levels.' },
                { name: 'Certiport', issuer: 'Pearson VUE', desc: 'IC3 Digital Literacy, MOS, Entrepreneurship & Small Business.' },
                { name: 'EPA 608 Universal', issuer: 'Mainstream Engineering', desc: 'Federal refrigerant handling certification. All equipment types.' },
                { name: 'OSHA 10/30-Hour', issuer: 'U.S. DOL', desc: 'Construction and general industry safety. DOL wallet card issued.' },
                { name: 'NRF RISE Up', issuer: 'NRF Foundation', desc: 'Retail industry fundamentals and customer service certification.' },
                { name: 'CPR / First Aid', issuer: 'AHA / HSI', desc: 'Healthcare provider and workplace responder certifications.' },
              ].map((cred) => (
                <div key={cred.name} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="font-bold text-slate-900 text-sm mb-0.5">{cred.name}</h3>
                  <p className="text-[11px] text-brand-red-600 font-medium mb-1.5">{cred.issuer}</p>
                  <p className="text-xs text-slate-600">{cred.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/credentials" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors">
              View All Credentials
            </Link>
            <Link href="/workkeys" className="border-2 border-slate-300 text-slate-700 font-bold px-8 py-3.5 rounded-lg hover:bg-slate-50 transition-colors">
              WorkKeys &amp; NCRC Details
            </Link>
          </div>
        </div>
      </section>
      

      {/* ===== FUNDING ===== */}
      
      <section aria-label="Funding options" className="py-10 sm:py-14 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-brand-red-600 font-bold text-sm mb-2 uppercase tracking-wide">Funding Available</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Funded Training for Eligible Participants</h2>
          <p className="text-lg text-slate-700 mb-8">
            Many programs are available at no cost to eligible participants through WIOA, WRG, and JRI. Platform access fees may apply depending on funding source and enrollment type.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {[
              { label: 'WIOA', desc: 'Covers tuition, books, and supplies for eligible adults and dislocated workers.', href: '/funding/federal-programs', image: '/images/hp/wioa.jpg' },
              { label: 'Workforce Ready Grant', desc: 'Indiana state grant covering high-demand certification programs at no cost for eligible participants.', href: '/funding/state-programs', image: '/images/hp/grants.jpg' },
              { label: 'Next Level Jobs', desc: 'Indiana employer training grant covering certification costs in high-demand fields like IT, healthcare, and skilled trades.', href: '/funding/state-programs', image: '/images/hp/funding.jpg' },
              { label: 'JRI (Justice Reinvestment)', desc: 'Paid apprenticeships and training for justice-involved individuals.', href: '/funding/jri', image: '/images/hp/healthcare.jpg' },
              { label: 'Indiana Career Connect', desc: 'Register to check your eligibility and apply for funding.', href: 'https://indianacareerconnect.com', image: '/images/hp/government.jpg', external: true },
            ].map((item) => (
              <div key={item.label} className="rounded-xl overflow-hidden border border-slate-200">
                <Image src={item.image} alt={item.label} width={600} height={400} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="w-full aspect-[3/2] object-cover" />
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{item.label}</h3>
                  <p className="text-slate-600 text-sm mb-4">{item.desc}</p>
                  <Link
                    href={item.href}
                    {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/wioa-eligibility" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-lg transition-colors text-center">
              Check Eligibility
            </Link>
            <Link href="/funding" className="border-2 border-brand-red-600 text-brand-red-600 font-bold px-8 py-4 rounded-lg hover:bg-brand-red-50 transition-colors text-center">
              All Funding Options
            </Link>
          </div>
        </div>
      </section>
      



      {/* ===== EMPLOYERS ===== */}
      
      <section aria-label="Employer partnerships" className="py-10 sm:py-14 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-brand-red-600 font-bold text-sm mb-2 uppercase tracking-wide">For Employers</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Hire Credentialed Graduates</h2>
              <p className="text-slate-700 mb-4">
                Every graduate holds nationally recognized credentials, has completed hands-on training, and is workforce-ready. Access <Link href="/employer" className="text-brand-red-600 font-semibold underline">WOTC tax credits</Link> ($2,400–$9,600 per qualifying hire) and <Link href="/ojt-and-funding" className="text-brand-red-600 font-semibold underline">OJT wage reimbursement</Link> (50–75% of wages during training).
              </p>
              <p className="text-slate-700 mb-6">
                Post open positions on our <Link href="/employer" className="text-brand-red-600 font-semibold underline">job board</Link> and our career services team will match you with pre-screened, credentialed candidates.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/employer" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-center text-sm">
                  Employer Portal
                </Link>
                <Link href="/apply/program-holder" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-lg transition-colors text-center text-sm">
                  Become a Partner
                </Link>
              </div>
            </div>
            <div className="relative h-64 sm:h-80 rounded-xl overflow-hidden">
              <Image src="/images/hp/candidates.jpg" alt="Credentialed graduates ready for employment" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>
      

      {/* ===== EMPLOYMENT SUPPORT ===== */}
      
      <section aria-label="Employment support services" className="py-10 sm:py-14 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">One-on-one employment support</h2>
            <p className="mt-3 text-slate-700">
              In addition to training, we provide individualized, one-on-one support to help participants prepare for and pursue
              competitive community employment, including job readiness, applications, interview prep, and employer connections.
            </p>
            <div className="mt-4">
              <Link
                href="/employment-support"
                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Learn about support services
              </Link>
            </div>
          </div>
        </div>
      </section>
      

      {/* ===== WHY ELEVATE ===== */}
      
      <section aria-label="Why choose Elevate" className="py-14 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/hp/why-elevate.jpg" alt="Students in a training session at Elevate for Humanity" width={800} height={600} sizes="(max-width: 1024px) 100vw, 50vw" className="w-full aspect-[4/3] object-cover" />
            </div>
            <div>
              <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Why Elevate</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6">A Workforce Credential Institute — Not Just a Training Provider</h2>
              <div className="space-y-4">
                {[
                  { title: 'Nationally recognized credentials', desc: 'Every program culminates in certifications issued by national bodies — EPA, OSHA, ACT, Certiport, NRF, AHA. Portable and verifiable.' },
                  { title: 'Authorized testing center', desc: 'Certiport, WorkKeys, and EPA 608 exams proctored on-site. No third-party testing fees or off-site scheduling.' },
                  { title: 'DOL Registered Apprenticeship sponsor', desc: 'Structured earn-and-learn pathways with formal training agreements and hour tracking.' },
                  { title: '$0 tuition through workforce funding', desc: 'WIOA, Workforce Ready Grant, and JRI cover tuition, books, and certification fees for eligible participants.' },
                  { title: 'Employer placement pipeline', desc: 'Direct hiring partnerships with Indiana employers. WOTC credits and OJT reimbursement available.' },
                  { title: 'Self-service enrollment', desc: 'Apply online in 5 minutes. Digital-first from application through credential issuance.' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-1.5 h-1.5 bg-slate-900 rounded-full mt-2.5" />
                    <div>
                      <p className="font-bold text-slate-900">{item.title}</p>
                      <p className="text-slate-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/apply/student" className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors shadow-lg shadow-brand-red-600/20">
                  Apply Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      

      {/* ===== TESTIMONIALS ===== */}
      
      <section aria-label="Student testimonials" className="py-10 sm:py-14 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">Real Students. Real Results.</h2>
            <p className="text-slate-500 text-lg">Hear from graduates who changed their careers through Elevate.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { quote: 'WIOA paid for my Medical Assistant training, and I started working right after graduation. Now I\'m making $42,000 a year with full benefits.', name: 'Sarah M.', program: 'Medical Assistant', salary: '$42K/yr', photo: '/images/testimonials-hq/person-1.jpg' },
              { quote: 'They provided an extremely informative and hospitable environment. I really enjoyed my classes. Thank you so much!', name: 'Timothy S.', program: 'CDL Training', salary: '$55K/yr', photo: '/images/testimonials-hq/person-4.jpg' },
              { quote: 'Anyone who wants to grow and make more money should try Elevate. You deserve it! The staff is amazing and easy to communicate with.', name: 'Jasmine R.', program: 'CNA Certification', salary: '$38K/yr', photo: '/images/testimonials-hq/person-3.jpg' },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  {[1,2,3,4,5].map((star) => (
                    <span key={star} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-slate-700 text-base mb-6 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image src={t.photo} alt={t.name} width={44} height={44} className="rounded-full object-cover w-11 h-11" />
                    <div>
                      <p className="font-bold text-slate-900">{t.name}</p>
                      <p className="text-slate-500 text-sm">{t.program}</p>
                    </div>
                  </div>
                  <span className="text-brand-green-600 font-bold text-sm bg-brand-green-50 px-3 py-1 rounded-full">{t.salary}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      

      {/* ===== CTA ===== */}
      
      <section aria-label="Get started" className="py-14 sm:py-20 bg-brand-red-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">Start Your Credential Pathway</h2>
          <p className="text-xl text-white/90 mb-10">
            Apply in minutes. Training may be fully funded. Graduate with nationally recognized credentials.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/apply/student" className="bg-white text-brand-red-600 px-10 py-4 rounded-lg font-bold text-lg hover:bg-slate-50 transition-colors">
              Apply Now
            </Link>
            <Link href="/programs" className="border-2 border-white/50 text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition-colors">
              View Credential Pathways
            </Link>
          </div>
        </div>
      </section>
      

      {/* ===== TRUST BAR ===== */}
      <section className="py-8 bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Recognized By</p>
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
            {[
              { src: '/images/partners/usdol.webp', alt: 'U.S. Department of Labor' },
              { src: '/images/partners/dwd.webp', alt: 'Indiana DWD' },
              { src: '/images/partners/workone.webp', alt: 'WorkOne Indiana' },
              { src: '/images/partners/nextleveljobs.webp', alt: 'Next Level Jobs' },
            ].map((logo) => (
              <Image key={logo.alt} src={logo.src} alt={logo.alt} width={100} height={40} className="object-contain h-8 w-auto opacity-70 hover:opacity-100 transition-opacity" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
