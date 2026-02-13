import Link from 'next/link';
import Image from 'next/image';
import HomeHeroVideo from './HomeHeroVideo';
import MarqueeBanner from '@/components/MarqueeBanner';
import PageAvatar from '@/components/PageAvatar';

import { StatStrip } from '@/components/StatStrip';
import { TestimonialCarousel } from '@/components/TestimonialCarousel';
import NewsletterSignup from '@/components/NewsletterSignup';
import { TrustBadges } from '@/components/TrustBadges';
import { ComplianceBadges } from '@/components/ComplianceBadges';
import ProgramFinder from '@/components/ProgramFinder';
import ProgramHighlights from '@/components/ProgramHighlights';

const programs = [
  { 
    name: 'Healthcare', 
    href: '/programs/healthcare', 
    image: '/images/hero/hero-healthcare.jpg', 
    description: 'CNA, Medical Assistant, Phlebotomy — get certified and working in weeks',
  },
  { 
    name: 'Skilled Trades', 
    href: '/programs/skilled-trades', 
    image: '/images/trades/hero-program-hvac.jpg', 
    description: 'HVAC, Electrical, Welding, Plumbing — hands-on training, real job placement',
  },
  { 
    name: 'Barber Apprenticeship', 
    href: '/programs/barber-apprenticeship', 
    image: '/images/barber-hero-new.jpg', 
    description: 'Earn while you learn — get paid during your apprenticeship',
  },
  { 
    name: 'CDL Training', 
    href: '/programs/cdl', 
    image: '/images/cdl-vibrant.jpg', 
    description: 'Class A & B commercial driving — start earning $50K+ in weeks',
  },
  { 
    name: 'Technology', 
    href: '/programs/technology', 
    image: '/images/programs-hq/it-support.jpg', 
    description: 'IT Support, Cybersecurity — high-demand tech careers',
  },
  { 
    name: 'CPR & First Aid', 
    href: '/programs/cpr-first-aid-hsi', 
    image: '/images/programs/cpr-certification-group-hd.jpg', 
    description: 'HSI certified — same-day certification available',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ===== MARQUEE BANNER ===== */}
      <MarqueeBanner />

      {/* ===== VIDEO HERO ===== */}
      <section className="relative h-[70vh] min-h-[500px] max-h-[700px]">
        <HomeHeroVideo />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 z-20" />
        <div className="absolute inset-0 z-30 flex flex-col items-end justify-end text-left px-8 pb-12 sm:px-12 sm:pb-16 md:px-20 md:pb-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-3 leading-tight drop-shadow-lg">
              Career Training That Works
            </h1>
            <p className="text-xl sm:text-2xl text-white/95 mb-6 drop-shadow-md">
              WIOA &amp; JRI funded programs available. Earn while you learn. Get certified and hired in weeks.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/apply/student" className="bg-brand-red-600 hover:bg-brand-red-700 text-white text-lg sm:text-xl font-bold px-8 py-4 rounded-full transition-all hover:scale-105 shadow-lg text-center">
                Apply Now
              </Link>
              <Link href="/programs" className="bg-white/95 hover:bg-white text-black text-lg sm:text-xl font-bold px-8 py-4 rounded-full transition-all hover:scale-105 shadow-lg text-center backdrop-blur-sm">
                View Programs
              </Link>
            </div>
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

      {/* ===== EARN WHILE YOU LEARN ===== */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-stone-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-[350px] sm:h-[420px] rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/5">
              <Image src="/images/hero/hero-hands-on-training.jpg" alt="Hands-on career training" fill className="object-cover object-center" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <div>
              <p className="text-brand-red-600 font-bold text-lg mb-2 tracking-wide uppercase">Why Elevate</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black mb-6 leading-tight">Earn While You Learn</h2>
              <p className="text-xl text-slate-700 mb-5 leading-relaxed">
                Get paid during your apprenticeship. Many of our JRI and WIOA-funded programs cover tuition and supplies. Some programs have tuition with flexible payment options.
              </p>
              <p className="text-xl text-green-700 font-bold mb-8">
                Funding available for qualifying students. Real certifications. Real jobs.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white text-lg font-bold px-8 py-4 rounded-full transition-all hover:scale-105 shadow-lg">
                  Register at Indiana Career Connect
                </a>
                <Link href="/funding" className="inline-block border-2 border-brand-red-600 text-brand-red-600 text-lg font-bold px-8 py-4 rounded-full transition-all hover:bg-brand-red-50 hover:scale-105">
                  Learn More About Funding →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ===== PARTNERS ===== */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-black mb-3">Approved Training Provider</h2>
            <p className="text-lg text-slate-600">We are approved and funded through these workforce partners</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <a href="https://www.dol.gov" target="_blank" rel="noopener noreferrer" className="group bg-white rounded-2xl p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-slate-200">
              <div className="flex justify-center mb-5">
                <Image src="/images/partners/usdol.webp" alt="US Department of Labor" width={96} height={96} className="w-24 h-24" />
              </div>
              <h3 className="font-bold text-black text-lg mb-2">US Department of Labor</h3>
              <p className="text-slate-600 text-base mb-4">Registered apprenticeship sponsor</p>
              <span className="inline-block bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-full group-hover:bg-blue-700 transition-colors">Learn More →</span>
            </a>
            <a href="https://www.in.gov/dwd" target="_blank" rel="noopener noreferrer" className="group bg-white rounded-2xl p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-slate-200">
              <div className="flex justify-center mb-5">
                <Image src="/images/partners/dwd.webp" alt="Indiana DWD" width={96} height={96} className="w-24 h-24" />
              </div>
              <h3 className="font-bold text-black text-lg mb-2">Indiana DWD</h3>
              <p className="text-slate-600 text-base mb-4">Department of Workforce Development</p>
              <span className="inline-block bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-full group-hover:bg-blue-700 transition-colors">Learn More →</span>
            </a>
            <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="group bg-white rounded-2xl p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-slate-200">
              <div className="flex justify-center mb-5">
                <Image src="/images/partners/workone.webp" alt="WorkOne" width={96} height={96} className="w-24 h-24" />
              </div>
              <h3 className="font-bold text-black text-lg mb-2">WorkOne</h3>
              <p className="text-slate-600 text-base mb-4">Register here for funding eligibility</p>
              <span className="inline-block bg-brand-red-600 text-white text-sm font-bold px-5 py-2.5 rounded-full group-hover:bg-brand-red-700 transition-colors">Register Now →</span>
            </a>
            <a href="https://nextleveljobs.org" target="_blank" rel="noopener noreferrer" className="group bg-white rounded-2xl p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-slate-200">
              <div className="flex justify-center mb-5">
                <Image src="/images/partners/nextleveljobs.webp" alt="Next Level Jobs" width={96} height={96} className="w-24 h-24" />
              </div>
              <h3 className="font-bold text-black text-lg mb-2">Next Level Jobs</h3>
              <p className="text-slate-600 text-base mb-4">Indiana workforce training grants</p>
              <span className="inline-block bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-full group-hover:bg-blue-700 transition-colors">Learn More →</span>
            </a>
          </div>
        </div>
      </section>

      {/* ===== PROGRAMS ===== */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-stone-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black mb-4">Training Programs</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Industry-recognized certifications in high-demand fields. Start your new career in weeks.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {programs.map((program) => (
              <Link 
                key={program.name}
                href={program.href}
                className="group hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden mb-3">
                  <Image src={program.image} alt={program.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover object-center group-hover:scale-105 transition-transform duration-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">{program.name}</h3>
                <p className="text-slate-600 text-sm sm:text-base mb-2">{program.description}</p>
                <span className="text-blue-600 font-semibold text-sm group-hover:underline">Learn More →</span>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/programs" className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white text-lg font-bold px-10 py-4 rounded-full transition-all hover:scale-105 shadow-lg">
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {/* ===== PROGRAM FINDER ===== */}
      <ProgramFinder />

      {/* ===== PROGRAM HIGHLIGHTS ===== */}
      <ProgramHighlights />

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-16 sm:py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black mb-4">How It Works</h2>
            <p className="text-xl text-slate-600">Four steps to your new career</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Register at WorkOne', desc: 'Sign up at indianacareerconnect.com and schedule an appointment with WorkOne to determine your funding eligibility', img: '/images/artlist/office-meeting.jpg', href: '/funding', linkLabel: 'Learn More' },
              { title: 'Choose Program', desc: 'Pick the career path that fits your goals and schedule', img: '/images/heroes-hq/programs-hero.jpg', href: '/programs', linkLabel: 'View Programs' },
              { title: 'Complete Training', desc: 'Hands-on classes, real experience, earn your certification', img: '/images/hero/hero-certifications.jpg', href: '/how-it-works', linkLabel: 'Learn More' },
              { title: 'Get Hired', desc: 'Our employer partners are actively hiring graduates', img: '/images/heroes/success-story-1.jpg', href: '/career-services', linkLabel: 'Career Services' },
            ].map((step) => (
              <Link key={step.title} href={step.href} className="group hover:-translate-y-1 transition-all duration-300">
                <div className="relative aspect-[3/2] rounded-2xl overflow-hidden mb-3">
                  <Image src={step.img} alt={step.title} fill className="object-cover object-center group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                </div>
                <h3 className="font-bold text-black text-lg mb-1">{step.title}</h3>
                <p className="text-slate-600 text-base mb-2">{step.desc}</p>
                <span className="text-blue-600 font-semibold text-sm group-hover:underline">{step.linkLabel} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>



      {/* ===== JRI — EARN WHILE YOU LEARN ===== */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-[350px] sm:h-[420px] rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/5">
              <Image src="/images/heroes-hq/jri-hero.jpg" alt="JRI Earn While You Learn program" fill className="object-cover object-center" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <div>
              <p className="text-brand-red-600 font-bold text-lg mb-2 tracking-wide uppercase">Job-Ready Incentive (JRI)</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black mb-6 leading-tight">Earn While You Learn</h2>
              <ul className="text-lg text-slate-700 mb-8 space-y-3">
                <li className="flex items-start gap-2"><span className="text-brand-red-600 font-bold mt-0.5">•</span> Get paid during your training — no student debt</li>
                <li className="flex items-start gap-2"><span className="text-brand-red-600 font-bold mt-0.5">•</span> JRI covers tuition, supplies, and certification fees</li>
                <li className="flex items-start gap-2"><span className="text-brand-red-600 font-bold mt-0.5">•</span> Available for healthcare, skilled trades, CDL, and more</li>
                <li className="flex items-start gap-2"><span className="text-brand-red-600 font-bold mt-0.5">•</span> Register at indianacareerconnect.com to check eligibility</li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/programs/jri" className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white text-lg font-bold px-8 py-4 rounded-full transition-all hover:scale-105 shadow-lg text-center">
                  Explore JRI Programs
                </Link>
                <Link href="/funding" className="inline-block border-2 border-brand-red-600 text-brand-red-600 text-lg font-bold px-8 py-4 rounded-full transition-all hover:bg-brand-red-50 hover:scale-105 text-center">
                  All Funding Options →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WIOA & WRG FUNDING ===== */}
      <section className="py-16 sm:py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <p className="text-blue-600 font-bold text-lg mb-2 tracking-wide uppercase">Funding Programs</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black mb-6 leading-tight">WIOA &amp; WRG Funding</h2>
              <ul className="text-lg text-slate-700 mb-8 space-y-3">
                <li className="flex items-start gap-2"><span className="text-blue-600 font-bold mt-0.5">•</span> <strong>WIOA</strong> — Federal workforce funding for eligible adults, dislocated workers, and youth</li>
                <li className="flex items-start gap-2"><span className="text-blue-600 font-bold mt-0.5">•</span> <strong>WRG</strong> — Workforce Ready Grant covers tuition for high-demand certifications</li>
                <li className="flex items-start gap-2"><span className="text-blue-600 font-bold mt-0.5">•</span> Step 1: Register at indianacareerconnect.com</li>
                <li className="flex items-start gap-2"><span className="text-blue-600 font-bold mt-0.5">•</span> Step 2: Schedule a WorkOne appointment for eligibility</li>
                <li className="flex items-start gap-2"><span className="text-blue-600 font-bold mt-0.5">•</span> Not all programs are free — some require tuition with flexible payment options</li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/wioa-eligibility" className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold px-8 py-4 rounded-full transition-all hover:scale-105 shadow-lg text-center">
                  Check WIOA Eligibility
                </Link>
                <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="inline-block border-2 border-blue-600 text-blue-600 text-lg font-bold px-8 py-4 rounded-full transition-all hover:bg-blue-50 hover:scale-105 text-center">
                  Register Now →
                </a>
              </div>
            </div>
            <div className="relative h-[350px] sm:h-[420px] rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/5 order-1 md:order-2">
              <Image src="/images/heroes-hq/funding-hero.jpg" alt="WIOA and WRG funding for career training" fill className="object-cover object-center" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHY PARTNER / EMPLOYERS ===== */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black mb-4">Partner With Us</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Hire trained, certified graduates. Access tax credits and funding. No phone calls needed — everything is self-service.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-8">
            {/* Employer Card */}
            <div className="group">
              <div className="relative aspect-[3/2] rounded-2xl overflow-hidden mb-4">
                <Image src="/images/heroes-hq/employer-hero.jpg" alt="Employer partnerships" fill className="object-cover object-center group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, 50vw" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Why Hire Our Graduates</h3>
              <ul className="text-slate-700 mb-4 space-y-2">
                <li className="flex items-start gap-2"><span className="text-orange-500 font-bold mt-0.5">•</span> Pre-trained, certified candidates ready to work day one</li>
                <li className="flex items-start gap-2"><span className="text-orange-500 font-bold mt-0.5">•</span> Access WOTC tax credits — up to $9,600 per hire</li>
                <li className="flex items-start gap-2"><span className="text-orange-500 font-bold mt-0.5">•</span> OJT reimbursement covers 50-75% of wages during training</li>
                <li className="flex items-start gap-2"><span className="text-orange-500 font-bold mt-0.5">•</span> Post jobs and browse candidates online</li>
              </ul>
              <Link href="/employer" className="inline-block bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold px-8 py-4 rounded-full transition-all hover:scale-105 shadow-lg">
                Employer Portal →
              </Link>
            </div>
            {/* Partner Card */}
            <div className="group">
              <div className="relative aspect-[3/2] rounded-2xl overflow-hidden mb-4">
                <Image src="/images/heroes-hq/success-hero.jpg" alt="Training partnerships" fill className="object-cover object-center group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, 50vw" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Why Partner With Elevate</h3>
              <ul className="text-slate-700 mb-4 space-y-2">
                <li className="flex items-start gap-2"><span className="text-blue-600 font-bold mt-0.5">•</span> Approved WIOA and JRI training provider</li>
                <li className="flex items-start gap-2"><span className="text-blue-600 font-bold mt-0.5">•</span> Full support ecosystem — funding, childcare, career placement</li>
                <li className="flex items-start gap-2"><span className="text-blue-600 font-bold mt-0.5">•</span> Industry-recognized certifications in high-demand fields</li>
                <li className="flex items-start gap-2"><span className="text-blue-600 font-bold mt-0.5">•</span> Apply to partner or list your programs online</li>
              </ul>
              <Link href="/apply/program-holder" className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold px-8 py-4 rounded-full transition-all hover:scale-105 shadow-lg">
                Become a Partner →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-16 sm:py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-black mb-4">What Our Students Say</h2>
            <p className="text-xl text-slate-600">Real stories from real graduates</p>
          </div>
          <TestimonialCarousel />
        </div>
      </section>

      {/* ===== TRUST BADGES & COMPLIANCE ===== */}
      <section className="py-12 bg-white border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <TrustBadges />
          </div>
          <div className="mt-8 flex justify-center">
            <ComplianceBadges />
          </div>
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <NewsletterSignup />

      {/* ===== CTA ===== */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-brand-red-600 via-brand-red-600 to-brand-red-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6">Start Your New Career Today</h2>
          <p className="text-xl sm:text-2xl text-white/95 mb-10">
            Apply in minutes. Most students begin training within 2-4 weeks.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/apply/student" className="bg-white text-brand-red-600 px-10 py-5 rounded-full font-bold text-xl hover:bg-slate-50 transition-all hover:scale-105 shadow-lg">
              Apply Now
            </Link>
            <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="border-2 border-white text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-white/10 transition-all backdrop-blur-sm">
              Register at Indiana Career Connect
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
