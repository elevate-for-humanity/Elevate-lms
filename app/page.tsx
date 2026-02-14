import Link from 'next/link';
import Image from 'next/image';
import { ComplianceBadges } from '@/components/ComplianceBadges';

const programs = [
  { name: 'Healthcare', href: '/programs/healthcare', image: '/images/hero/hero-healthcare.jpg', desc: 'CNA, Medical Assistant, Phlebotomy' },
  { name: 'Skilled Trades', href: '/programs/skilled-trades', image: '/images/trades/hero-program-hvac.jpg', desc: 'HVAC, Electrical, Welding, Plumbing' },
  { name: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship', image: '/images/barber-hero-new.jpg', desc: 'Earn while you learn' },
  { name: 'CDL Training', href: '/programs/cdl', image: '/images/cdl-vibrant.jpg', desc: 'Class A & B — start earning $50K+' },
  { name: 'Technology', href: '/programs/technology', image: '/images/programs-hq/it-support.jpg', desc: 'IT Support, Cybersecurity' },
  { name: 'CPR & First Aid', href: '/programs/cpr-first-aid-hsi', image: '/images/healthcare/healthcare-professional-portrait-1.jpg', desc: 'HSI certified — same-day available' },
];

const steps = [
  { num: '01', title: 'Register', desc: 'Sign up at indianacareerconnect.com to determine funding eligibility.', href: '/funding' },
  { num: '02', title: 'Choose a Program', desc: 'Pick the career path that fits your goals and schedule.', href: '/programs' },
  { num: '03', title: 'Complete Training', desc: 'Hands-on classes, real experience, earn your certification.', href: '/how-it-works' },
  { num: '04', title: 'Get Hired', desc: 'Our employer partners are actively hiring graduates.', href: '/career-services' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ===== HERO ===== */}
      <section className="relative h-[75vh] min-h-[520px] max-h-[720px]">
        <Image
          src="/images/hero-poster.jpg"
          alt="Career training at Elevate for Humanity"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 z-10 flex items-center">
          <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full">
            <div className="max-w-xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-4 leading-[1.1]">
                Limitless<br />Opportunities
              </h1>
              <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed">
                Free career training through WIOA, WRG, and JRI funding. Get certified and hired in weeks.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/apply/student" className="bg-red-600 hover:bg-red-700 text-white text-lg font-bold px-8 py-4 rounded-lg transition-colors text-center">
                  Apply Now
                </Link>
                <Link href="/programs" className="bg-white/95 hover:bg-white text-slate-900 text-lg font-bold px-8 py-4 rounded-lg transition-colors text-center">
                  View Programs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 3-CARD VALUE PROPS ===== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Career Opportunities', desc: 'See our career pathways and find the best fit for your future.', href: '/programs', image: '/images/hero/hero-hands-on-training.jpg' },
              { title: 'Funding Available', desc: 'Most programs are 100% free through WIOA, WRG, and JRI funding.', href: '/funding', image: '/images/heroes-hq/funding-hero.jpg' },
              { title: 'Hire Our Graduates', desc: 'Our candidates come out credentialed and ready to work.', href: '/employer', image: '/images/heroes-hq/employer-hero.jpg' },
            ].map((card) => (
              <Link key={card.title} href={card.href} className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-slate-100">
                <div className="relative w-full h-48">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-slate-700 mb-3">{card.desc}</p>
                  <span className="text-blue-600 font-semibold group-hover:underline">Learn More →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROGRAMS ===== */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">Programs & Pathways</h2>
            <p className="text-lg text-slate-700 max-w-2xl mx-auto">
              Industry-recognized certifications in high-demand fields. Start your new career in weeks.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {programs.map((program) => (
              <Link key={program.name} href={program.href} className="group">
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
                  <Image
                    src={program.image}
                    alt={program.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-base sm:text-lg">{program.name}</h3>
                    <p className="text-white/80 text-xs sm:text-sm">{program.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/programs" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-lg transition-colors">
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">How It Works</h2>
            <p className="text-lg text-slate-700">Four steps to your new career</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <Link key={step.num} href={step.href} className="group text-center">
                <div className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold group-hover:bg-red-700 transition-colors">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-700 text-sm">{step.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FUNDING ===== */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
              <Image
                src="/images/heroes-hq/jri-hero.jpg"
                alt="Earn while you learn"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-red-600 font-bold text-sm mb-2 uppercase tracking-wide">Funding Available</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">100% Tuition-Free Programs</h2>
              <p className="text-lg text-slate-700 mb-6">
                Most programs are fully funded through WIOA, WRG, and JRI. No tuition, no fees, no debt.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'WIOA — Federal workforce funding for eligible adults',
                  'WRG — Workforce Ready Grant covers high-demand certifications',
                  'JRI — Earn while you learn with paid apprenticeships',
                  'Register at indianacareerconnect.com to check eligibility',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-800">
                    <span className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/wioa-eligibility" className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-center">
                  Check Eligibility
                </Link>
                <Link href="/funding" className="border-2 border-red-600 text-red-600 font-bold px-6 py-3 rounded-lg hover:bg-red-50 transition-colors text-center">
                  All Funding Options
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PARTNERS ===== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">Approved Training Provider</h2>
            <p className="text-lg text-slate-700">Funded and recognized by leading workforce organizations</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center">
            {[
              { src: '/images/partners/usdol.webp', alt: 'U.S. Department of Labor' },
              { src: '/images/partners/dwd.webp', alt: 'Indiana DWD' },
              { src: '/images/partners/workone.webp', alt: 'WorkOne Indiana' },
              { src: '/images/partners/nextleveljobs.webp', alt: 'Next Level Jobs' },
            ].map((logo) => (
              <div key={logo.alt} className="h-20 w-full flex items-center justify-center p-4 bg-white rounded-lg border border-slate-100">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={160}
                  height={64}
                  className="object-contain h-12 w-auto"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <ComplianceBadges />
          </div>
        </div>
      </section>

      {/* ===== EMPLOYERS ===== */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-blue-600 font-bold text-sm mb-2 uppercase tracking-wide">For Employers</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Hire Our Skilled Graduates</h2>
              <p className="text-lg text-slate-700 mb-6">
                Our candidates come out of our programs credentialed and ready to work. Access tax credits and funding.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Pre-trained, certified candidates ready day one',
                  'WOTC tax credits — up to $9,600 per hire',
                  'OJT reimbursement covers 50-75% of wages',
                  'Post jobs and browse candidates online',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-800">
                    <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/employer" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-center">
                  Employer Portal
                </Link>
                <Link href="/apply/program-holder" className="border-2 border-blue-600 text-blue-600 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors text-center">
                  Become a Partner
                </Link>
              </div>
            </div>
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
              <Image
                src="/images/heroes-hq/employer-hero.jpg"
                alt="Hire our graduates"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-16 sm:py-20">
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
              <div key={t.name} className="bg-slate-50 rounded-xl p-8 border border-slate-100">
                <p className="text-slate-800 mb-6 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-bold text-slate-900">{t.name}</p>
                  <p className="text-slate-600 text-sm">{t.program}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 sm:py-28 bg-red-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">Ready to Change Your Life?</h2>
          <p className="text-xl text-white/90 mb-10">
            Apply in minutes. Most students begin training within 2-4 weeks.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/apply/student" className="bg-white text-red-600 px-10 py-4 rounded-lg font-bold text-lg hover:bg-slate-50 transition-colors">
              Get Started Today
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
