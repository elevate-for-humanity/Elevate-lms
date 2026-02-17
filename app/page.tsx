'use client';

import Link from 'next/link';
import Image from 'next/image';
import { lazy, Suspense } from 'react';

import HomeHeroVideo from './HomeHeroVideo';
import PageAvatar from '@/components/PageAvatar';
import { InView } from '@/components/ui/InView';

const ProgramFinderQuiz = lazy(() => import('@/components/quiz/ProgramFinderQuiz'));

const programs = [
  { name: 'Healthcare', href: '/programs/healthcare', image: '/images/hero/hero-healthcare.jpg', desc: 'CNA, Medical Assistant, Phlebotomy' },
  { name: 'Skilled Trades', href: '/programs/skilled-trades', image: '/images/trades/hero-program-hvac.jpg', desc: 'HVAC, Electrical, Welding, Plumbing' },
  { name: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship', image: '/images/barber-hero-new.jpg', desc: 'Earn while you learn' },
  { name: 'CDL Training', href: '/programs/cdl', image: '/images/cdl-vibrant.jpg', desc: 'Class A & B — start earning $50K+' },
  { name: 'Technology', href: '/programs/technology', image: '/images/programs-hq/it-support.jpg', desc: 'IT Support, Cybersecurity' },
  { name: 'CPR & First Aid', href: '/programs/cpr-first-aid-hsi', image: '/images/healthcare/healthcare-professional-portrait-1.jpg', desc: 'HSI certified — same-day available' },
];



export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ===== HERO ===== */}
      <section className="relative">
        <div className="relative h-[60vh] min-h-[400px] max-h-[600px]">
          <HomeHeroVideo />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-[1.05]">
              Limitless Opportunities
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 mt-4 leading-relaxed max-w-2xl mx-auto">
              Free career training in healthcare, skilled trades, CDL, technology, and barbering. Funded by WIOA, state grants, and employer partnerships across Indiana.
            </p>
          </div>
        </div>
      </section>

      {/* ===== AVATAR GUIDE ===== */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <PageAvatar
            videoSrc="/videos/avatars/home-welcome.mp4"
            title="Welcome to Elevate for Humanity"
          />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                href: '/programs',
                image: '/images/artlist/cropped/hero-training-3-square.jpg',
                alt: 'Students in a hands-on training session',
                label: 'I want to train',
                desc: 'Browse programs in healthcare, trades, CDL, tech, and barbering. See schedules, requirements, and how to enroll.',
              },
              {
                href: '/funding',
                image: '/images/heroes-hq/funding-hero.jpg',
                alt: 'Workforce funding and financial aid',
                label: 'I need funding',
                desc: 'Many programs are available at no cost to eligible participants. Check eligibility for WIOA, Workforce Ready Grant, JRI, and other funding sources.',
              },
              {
                href: '/employer',
                image: '/images/business-vibrant.jpg',
                alt: 'Employer reviewing candidate profiles',
                label: 'I&apos;m an employer',
                desc: 'Hire credentialed graduates, access WOTC tax credits up to $9,600/hire, and get OJT wage reimbursements.',
              },
              {
                href: '/store',
                image: '/images/homepage/schools-nonprofits.jpg',
                alt: 'Training school using the Elevate platform',
                label: 'I run a school',
                desc: 'License the Elevate platform for your organization. White-label LMS with enrollment, compliance, and reporting.',
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-3 p-5 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-brand-blue-400 hover:shadow-md transition-all text-center group"
              >
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden">
                  <Image src={item.image} alt={item.alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                </div>
                <span className="font-semibold text-lg text-slate-900 group-hover:text-brand-blue-600">{item.label}</span>
                <span className="text-sm text-slate-500">{item.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      </InView>

      {/* ===== 3-CARD VALUE PROPS ===== */}
      <InView animation="fade-up">
      <section aria-label="Career opportunities" className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              { title: 'Career Opportunities', desc: 'We offer certification programs in healthcare (CNA, Medical Assistant, Phlebotomy), skilled trades (HVAC, Electrical, Welding, Plumbing), CDL trucking, IT/cybersecurity, and barbering. Most programs are 4-16 weeks and include hands-on training.', href: '/programs', image: '/images/heroes-hq/programs-hero.jpg' },
              { title: 'Funding Available', desc: 'Most students pay nothing. WIOA covers tuition, books, and supplies. The Workforce Ready Grant funds high-demand certifications. JRI provides paid apprenticeships for justice-involved individuals. Check your eligibility online in minutes.', href: '/funding', image: '/images/highlights/government-certified.jpg' },
              { title: 'Hire Our Graduates', desc: 'Employers: our graduates hold industry-recognized credentials and are ready to work. Access WOTC tax credits (up to $9,600/hire), OJT wage reimbursements (50-75% of wages), and post jobs directly to our candidate pool.', href: '/employer', image: '/images/business-hero-new.jpg' },
            ].map((card) => (
              <Link key={card.title} href={card.href} className="group block">
                <div className="relative aspect-[3/2] rounded-lg overflow-hidden">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="pt-4">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-base text-slate-700 mb-3">{card.desc}</p>
                  <span className="inline-block bg-brand-red-600 text-white font-semibold text-sm px-5 py-2.5 rounded-lg group-hover:bg-brand-red-700 transition-colors">Learn More</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      </InView>

      {/* ===== PROGRAMS ===== */}
      <InView animation="fade-up">
      <section aria-label="Programs and pathways" className="py-10 sm:py-14 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">Programs & Pathways</h2>
            <p className="text-lg text-slate-700 max-w-2xl mx-auto">
              Industry-recognized certifications in high-demand fields. Start your new career in weeks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <Link key={program.name} href={program.href} className="group">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                  <Image
                    src={program.image}
                    alt={program.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="pt-3">
                  <h3 className="text-slate-900 font-bold text-lg sm:text-xl">{program.name}</h3>
                  <p className="text-slate-600 text-sm sm:text-base mt-1">{program.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/programs" className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white text-lg font-bold px-10 py-4 rounded-lg transition-colors">
              View All Programs
            </Link>
          </div>
        </div>
      </section>
      </InView>

      {/* ===== FIND YOUR PATH QUIZ ===== */}
      <InView animation="fade-up">
      <section id="find-your-path" aria-label="Find your path" className="py-16 sm:py-20 bg-gradient-to-b from-slate-50 to-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Interactive Guide</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Find your path in 30 seconds
            </h2>
            <p className="text-lg text-slate-600 mt-3">
              Answer three quick questions and we&apos;ll match you with the right program.
            </p>
          </div>
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-slate-400">Loading...</div>}>
            <ProgramFinderQuiz />
          </Suspense>
        </div>
      </section>
      </InView>

      {/* ===== HOW IT WORKS ===== */}
      <InView animation="fade-up">
      <section aria-label="How it works" className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">How It Works</h2>
            <p className="text-lg text-slate-700">Four steps to your new career</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Register', desc: 'Sign up at indianacareerconnect.com to determine funding eligibility.', href: '/funding', image: '/images/workforce-1.jpg' },
              { title: 'Choose a Program', desc: 'Pick the career path that fits your goals and schedule.', href: '/programs', image: '/images/Content_PATHWAY_TRADES.jpg' },
              { title: 'Complete Training', desc: 'Hands-on classes, real experience, earn your certification.', href: '/how-it-works', image: '/images/workforce-2.jpg' },
              { title: 'Get Hired', desc: 'Our employer partners are actively hiring graduates.', href: '/career-services', image: '/images/workforce-3.jpg' },
            ].map((step) => (
              <div key={step.title} className="text-center">
                <Image
                  src={step.image}
                  alt={step.title}
                  width={400}
                  height={267}
                  className="w-full h-auto rounded-lg mb-4"
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

      {/* ===== FUNDING ===== */}
      <InView animation="fade-up">
      <section aria-label="Funding options" className="py-10 sm:py-14 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <Image
            src="/images/hero-banner-new.jpg"
            alt="Students in funded training programs"
            width={1400}
            height={788}
            sizes="(max-width: 768px) 100vw, 960px"
            className="w-full h-auto rounded-lg mb-10"
          />
          <p className="text-brand-red-600 font-bold text-sm mb-2 uppercase tracking-wide">Funding Available</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">100% Tuition-Free Programs</h2>
          <p className="text-lg text-slate-700 mb-8">
            Most programs are fully funded through WIOA, WRG, and JRI. No tuition, no fees, no debt.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            {[
              { label: 'WIOA', desc: 'Covers tuition, books, and supplies for eligible adults and dislocated workers.', href: '/funding/federal-programs', image: '/images/community-healthcare-worker.jpg' },
              { label: 'Workforce Ready Grant', desc: 'Indiana state grant covering high-demand certification programs at no cost.', href: '/funding/state-programs', image: '/images/facility-hero.jpg' },
              { label: 'JRI (Justice Reinvestment)', desc: 'Paid apprenticeships and training for justice-involved individuals.', href: '/funding/jri', image: '/images/funding/funding-jri-program.jpg' },
              { label: 'Indiana Career Connect', desc: 'Register to check your eligibility and apply for funding.', href: 'https://indianacareerconnect.com', image: '/images/homepage/government-agencies.jpg', external: true },
            ].map((item) => (
              <div key={item.label} className="rounded-xl overflow-hidden border border-slate-200">
                <Image src={item.image} alt={item.label} width={600} height={400} className="w-full h-auto" />
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

      {/* ===== PARTNERS ===== */}
      <InView animation="fade">
      <section aria-label="Approved training partners" className="py-10 sm:py-14 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-10">Approved Training Provider</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            {[
              { src: '/images/partners/usdol.webp', alt: 'U.S. Department of Labor', href: 'https://www.dol.gov' },
              { src: '/images/partners/dwd.webp', alt: 'Indiana DWD', href: 'https://www.in.gov/dwd' },
              { src: '/images/partners/workone.webp', alt: 'WorkOne Indiana', href: 'https://www.in.gov/dwd/workone' },
              { src: '/images/partners/nextleveljobs.webp', alt: 'Next Level Jobs', href: 'https://nextleveljobs.org' },
            ].map((logo) => (
              <a key={logo.alt} href={logo.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center p-4 hover:opacity-80 transition-opacity">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={160}
                  height={64}
                  className="object-contain h-14 w-auto"
                />
              </a>
            ))}
          </div>
        </div>
      </section>
      </InView>

      {/* ===== EMPLOYERS ===== */}
      <InView animation="fade-up">
      <section aria-label="Employer partnerships" className="py-10 sm:py-14 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <Image
            src="/images/efh-building-tech-hero.jpg"
            alt="Employer partners hiring trained graduates"
            width={1600}
            height={1067}
            sizes="(max-width: 768px) 100vw, 960px"
            className="w-full h-auto rounded-lg mb-10"
          />
          <p className="text-brand-red-600 font-bold text-sm mb-2 uppercase tracking-wide">For Employers</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Hire Our Skilled Graduates</h2>
          <p className="text-lg text-slate-700 mb-8">
            Our candidates come out of our programs credentialed and ready to work. Access tax credits and funding.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            {[
              { label: 'Pre-trained Candidates', desc: 'Every graduate holds an industry-recognized credential and has completed hands-on training. Background checks and drug screening are completed where required by employer or program.', href: '/career-services', image: '/images/heroes-hq/career-services-hero.jpg' },
              { label: 'WOTC Tax Credits', desc: 'The Work Opportunity Tax Credit gives you up to $9,600 per qualifying hire. We help you identify eligible candidates and file the paperwork before the 28-day deadline.', href: '/employer', image: '/images/programs-hq/business-training.jpg' },
              { label: 'OJT Reimbursement', desc: 'On-the-Job Training funding reimburses 50-75% of a new hire\'s wages during their training period. You train them your way while the workforce board covers most of the cost.', href: '/ojt-and-funding', image: '/images/heroes-hq/employer-hero.jpg' },
              { label: 'Post Jobs Online', desc: 'List your open positions directly on our job board. Our career services team matches your requirements with qualified graduates and sends you pre-screened candidates.', href: '/employer', image: '/images/artlist/cropped/hero-training-8-wide.jpg' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl overflow-hidden border border-slate-200">
                <div className="relative aspect-[3/2]">
                  <Image src={item.image} alt={item.label} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
                </div>
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

      {/* ===== TESTIMONIALS ===== */}
      <InView animation="fade-up">
      <section aria-label="Student testimonials" className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">What Our Students Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { quote: 'WIOA paid for my Medical Assistant training, and I started working right after graduation. Now I\'m making $42,000 a year with full benefits.', name: 'Sarah M.', program: 'Medical Assistant' },
              { quote: 'They provided an extremely informative and hospitable environment. I really enjoyed my classes. Thank you so much!', name: 'Timothy S.', program: 'CDL Training' },
              { quote: 'Anyone who wants to grow and make more money should try Elevate. You deserve it! The staff is amazing and easy to communicate with.', name: 'Jasmine R.', program: 'CNA Certification' },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
                <p className="text-slate-800 text-lg mb-6 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-bold text-slate-900 text-base">{t.name}</p>
                  <p className="text-slate-600 text-base">{t.program}</p>
                </div>
              </div>
            ))}
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
    </main>
  );
}
