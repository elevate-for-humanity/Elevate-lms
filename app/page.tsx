import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

import HomeHeroVideo from './HomeHeroVideo';
import { InView } from '@/components/ui/InView';

export const metadata: Metadata = {
  title: 'Elevate for Humanity | Funded Career Training in Healthcare, Trades, CDL & Technology',
  description: 'Free career training for eligible Indiana residents through WIOA, WRG, and JRI funding. Programs in healthcare, skilled trades, CDL, technology, and barbering.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ===== NOW ENROLLING BANNER ===== */}
      <div className="bg-brand-green-600 text-white py-2.5 text-center text-sm font-semibold tracking-wide">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-3 flex-wrap">
          <span>Now Enrolling — Grant-Funded Career Training Programs</span>
          <Link href="/apply" className="inline-flex items-center gap-1 bg-white text-brand-green-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-brand-green-50 transition-colors">
            Check Eligibility →
          </Link>
        </div>
      </div>

      {/* ===== HERO VIDEO ===== */}
      <section className="relative h-[65vh] min-h-[400px] max-h-[720px]">
        <HomeHeroVideo />
      </section>

      {/* ===== HERO CTA ===== */}
      <section className="bg-slate-900 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08]">
            Your New Career Starts Here.
            <span className="block text-brand-red-400 mt-1">Funded Training. Real Careers.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed max-w-2xl mx-auto">
            Career training in healthcare, skilled trades, CDL, and technology.
            Training may be fully funded for eligible participants through WIOA and state workforce programs.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link href="/apply/student" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg text-base sm:text-lg transition-all shadow-lg shadow-brand-red-600/30">
              Apply Now
            </Link>
            <Link href="/programs" className="bg-white/15 border border-white/30 text-white font-bold px-8 py-3.5 rounded-lg text-base sm:text-lg hover:bg-white/25 transition-all">
              Browse Programs
            </Link>
          </div>
        </div>
      </section>

      {/* ===== AUDIENCE QUICK LINKS ===== */}
      <InView animation="fade-up">
      <section className="py-10 sm:py-12 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-3">
            How can we help you?
          </h2>
          <p className="text-center text-slate-600 mb-8 max-w-2xl mx-auto">
            Choose your path below. Each option takes you directly to the information you need — everything starts online.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { href: '/programs', label: 'I want to train', desc: 'Browse funded programs in healthcare, trades, CDL, and tech.', cta: 'Browse Programs', image: '/images/hp/train.jpg', alt: 'Students in a training classroom' },
              { href: '/funding', label: 'I need funding', desc: 'Training may be fully funded for eligible participants. Check your eligibility.', cta: 'Check Eligibility', image: '/images/hp/funding.jpg', alt: 'Funding and financial aid' },
              { href: '/employer', label: "I'm an employer", desc: 'Hire credentialed graduates. Access WOTC tax credits.', cta: 'Hire Graduates', image: '/images/hp/employer.jpg', alt: 'Employer partnership meeting' },
              { href: '/store', label: 'I run a school', desc: 'License the Elevate platform for your organization.', cta: 'Get Licensed', image: '/images/hp/school.jpg', alt: 'Training program office' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col bg-white rounded-xl border-2 border-slate-200 hover:border-brand-red-400 hover:shadow-md transition-all group overflow-hidden"
              >
                <Image src={item.image} alt={item.alt} width={600} height={400} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="w-full aspect-[3/2] object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="p-5 flex flex-col flex-1">
                  <span className="font-bold text-lg text-slate-900 mb-1">{item.label}</span>
                  <span className="text-sm text-slate-600 mb-4 flex-1">{item.desc}</span>
                  <span className="text-brand-red-600 font-semibold text-sm group-hover:underline">
                    {item.cta} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      </InView>



      {/* ===== HOW IT WORKS ===== */}
      <InView animation="fade-up">
      <section aria-label="How it works" className="py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">How It Works</h2>
            <p className="text-lg text-slate-700">Four steps to your new career</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Apply Online', desc: 'Fill out a short application — takes about 5 minutes. No account needed.', href: '/apply/student', image: '/images/hp/apply-online.jpg' },
              { title: 'Choose a Program', desc: 'Pick the career path that fits your goals and schedule.', href: '/programs', image: '/images/hp/choose-program.jpg' },
              { title: 'Complete Training', desc: 'Hands-on classes, real experience, earn your certification.', href: '/how-it-works', image: '/images/hp/complete-training.jpg' },
              { title: 'Get Hired', desc: 'Our employer partners are actively hiring graduates.', href: '/career-services', image: '/images/workforce-3.jpg' },
            ].map((step) => (
              <div key={step.title} className="text-center">
                <Image
                  src={step.image}
                  alt={step.title}
                  width={800}
                  height={533}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="w-full aspect-[3/2] object-cover rounded-lg mb-4"
                />
                <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-700 text-base mb-4">{step.desc}</p>
                <Link href={step.href} className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
                  Learn More
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      </InView>

      {/* ===== INSTITUTIONAL GOVERNANCE ===== */}
      <InView animation="fade-up">
      <section aria-label="About the institute" className="py-10 sm:py-14 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-brand-red-600 font-bold text-sm mb-2 uppercase tracking-wide">About the Institute</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">A Centralized Workforce Development &amp; Apprenticeship Sponsor</h2>
          <p className="text-lg text-slate-700 leading-relaxed mb-6">
            Elevate for Humanity Career &amp; Technical Institute, a program of 2Exclusive LLC-S, operates as a centralized workforce development and Registered Apprenticeship sponsor organization. The institute provides related technical instruction (RTI), apprenticeship sponsorship, workforce-funded career pathway enrollment, and coordination with licensed employer training sites under a unified governance and compliance structure.
          </p>
          <p className="text-base text-slate-600 leading-relaxed mb-6">
            Apprentices receive structured instruction through the institute while completing supervised on-the-job training at sponsor-approved licensed partner locations in accordance with state and federal apprenticeship standards.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-lg p-5 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">Related Technical Instruction</h3>
              <p className="text-sm text-slate-600">Delivered by the institute through structured curriculum and learning systems.</p>
            </div>
            <div className="bg-white rounded-lg p-5 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">On-the-Job Training</h3>
              <p className="text-sm text-slate-600">Delivered at licensed employer partner locations operating under formal training agreements.</p>
            </div>
            <div className="bg-white rounded-lg p-5 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">Oversight &amp; Compliance</h3>
              <p className="text-sm text-slate-600">Managed by the Sponsor including standards, hour tracking, apprentice registration, and regulatory reporting.</p>
            </div>
          </div>
          <div className="mt-6">
            <Link href="/governance" className="text-brand-red-600 font-semibold hover:underline text-sm">
              View Governance &amp; Program Structure →
            </Link>
          </div>
        </div>
      </section>
      </InView>

      {/* ===== FUNDING ===== */}
      <InView animation="fade-up">
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
              { label: 'Next Level Jobs', desc: 'Indiana employer training grant covering certification costs in high-demand fields like IT, healthcare, and skilled trades.', href: '/funding/state-programs', image: '/images/heroes-hq/funding-hero.jpg' },
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
      </InView>



      {/* ===== EMPLOYERS ===== */}
      <InView animation="fade-up">
      <section aria-label="Employer partnerships" className="py-10 sm:py-14 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-brand-red-600 font-bold text-sm mb-2 uppercase tracking-wide">For Employers</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Hire Our Skilled Graduates</h2>
          <p className="text-lg text-slate-700 mb-8">
            Our candidates come out of our programs credentialed and ready to work. Access tax credits and funding.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-10">
            {[
              { label: 'Pre-trained Candidates', desc: 'Every graduate holds an industry-recognized credential and has completed hands-on training. Background checks and drug screening are completed where required by employer or program.', href: '/career-services', image: '/images/hp/candidates.jpg' },
              { label: 'WOTC Tax Credits', desc: 'The Work Opportunity Tax Credit gives employers $2,400 per qualifying hire (up to $9,600 for qualified veterans). Targeted groups include formerly incarcerated, TANF/SNAP recipients, and long-term unemployed. We help file Form 8850 within the 28-day deadline.', href: '/employer', image: '/images/hp/wotc.jpg' },
              { label: 'OJT Reimbursement', desc: 'On-the-Job Training funding reimburses 50-75% of a new hire\'s wages during their training period. You train them your way while the workforce board covers most of the cost.', href: '/ojt-and-funding', image: '/images/hp/ojt.jpg' },
              { label: 'Post Jobs Online', desc: 'List your open positions directly on our job board. Our career services team matches your requirements with qualified graduates and sends you pre-screened candidates.', href: '/employer', image: '/images/hp/post-jobs.jpg' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl overflow-hidden border border-slate-200">
                <Image src={item.image} alt={item.label} width={600} height={400} sizes="(max-width: 640px) 100vw, 50vw" className="w-full aspect-[3/2] object-cover" />
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{item.label}</h3>
                  <p className="text-slate-600 text-sm mb-4">{item.desc}</p>
                  <Link href={item.href} className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
                    Learn More
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/employer" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-lg transition-colors text-center">
              Employer Portal
            </Link>
            <Link href="/apply/program-holder" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-4 rounded-lg transition-colors text-center">
              Become a Partner
            </Link>
          </div>
        </div>
      </section>
      </InView>

      {/* ===== EMPLOYMENT SUPPORT ===== */}
      <InView animation="fade-up">
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
      </InView>

      {/* ===== WHY ELEVATE ===== */}
      <InView animation="fade-up">
      <section aria-label="Why choose Elevate" className="py-14 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/hp/why-elevate.jpg" alt="Students in a training session at Elevate for Humanity" width={800} height={600} sizes="(max-width: 1024px) 100vw, 50vw" className="w-full aspect-[4/3] object-cover" />
            </div>
            <div>
              <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Why Elevate</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6">Not Just Training — A Complete Career Launch System</h2>
              <div className="space-y-4">
                {[
                  { title: '$0 tuition for most programs', desc: 'WIOA, WRG, and JRI funding covers tuition, books, and supplies. You pay nothing.' },
                  { title: 'Industry-recognized credentials', desc: 'Graduate with certifications employers actually require — CNA, CDL, OSHA, EPA 608, CompTIA.' },
                  { title: 'Job placement support', desc: 'Resume help, interview prep, and direct connections to hiring employers in Indiana.' },
                  { title: 'Registered apprenticeships', desc: 'DOL-registered programs where you earn a paycheck while you train.' },
                  { title: 'Self-service enrollment', desc: 'Apply online in 5 minutes. No appointments, no waiting rooms, no paperwork mailed in.' },
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
      </InView>

      {/* ===== TESTIMONIALS ===== */}
      <InView animation="fade-up">
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
      </InView>

      {/* ===== EMPLOYMENT SUPPORT ===== */}
      <InView animation="fade-up">
      <section aria-label="Employment support" className="py-10 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 shadow-sm">
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
      </InView>

      {/* ===== CTA ===== */}
      <InView animation="fade-up">
      <section aria-label="Get started" className="py-14 sm:py-20 bg-brand-red-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">Ready to Change Your Life?</h2>
          <p className="text-xl text-white/90 mb-10">
            Apply in minutes. Most students begin training within 2-4 weeks.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/apply/student" className="bg-white text-brand-red-600 px-10 py-4 rounded-lg font-bold text-lg hover:bg-slate-50 transition-colors">
              Get Started Today
            </Link>
          </div>
        </div>
      </section>
      </InView>

      {/* ===== TRUST BAR ===== */}
      <section className="py-8 bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Recognized By</p>
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 mb-6">
            {[
              { src: '/images/partners/usdol.webp', alt: 'U.S. Department of Labor' },
              { src: '/images/partners/dwd.webp', alt: 'Indiana DWD' },
              { src: '/images/partners/workone.webp', alt: 'WorkOne Indiana' },
              { src: '/images/partners/nextleveljobs.webp', alt: 'Next Level Jobs' },
            ].map((logo) => (
              <Image key={logo.alt} src={logo.src} alt={logo.alt} width={100} height={40} className="object-contain h-8 w-auto opacity-70 hover:opacity-100 transition-opacity" />
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
            {[
              '501(c)(3) Nonprofit', 'ETPL Listed', 'WIOA Provider', 'Workforce Ready Grant',
              'JRI Approved', 'Certiport Testing Center', 'EPA 608 Testing Site',
              'OSHA 10/30', 'HSI Training Center', 'IRS Enrolled Agent',
            ].map((badge) => (
              <span key={badge} className="inline-block bg-white border border-slate-200 text-slate-600 text-[11px] font-medium px-2.5 py-1 rounded-full">
                {badge}
              </span>
            ))}
            <Link href="/credentials" className="inline-block text-brand-blue-600 text-[11px] font-semibold px-2.5 py-1 hover:underline">
              View all credentials →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
