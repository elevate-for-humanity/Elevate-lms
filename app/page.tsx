import Link from 'next/link';
import Image from 'next/image';

import HomeHeroVideo from './HomeHeroVideo';
import PageAvatar from '@/components/PageAvatar';

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
      <section className="relative h-[75vh] min-h-[520px] max-h-[720px]">
        <HomeHeroVideo />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent z-20" />
        <div className="absolute inset-0 z-30 flex items-center">
          <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full">
            <div className="max-w-2xl">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-[1.05]">
                Limitless<br />Opportunities
              </h1>
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

      {/* ===== AUDIENCE QUICK LINKS ===== */}
      <section className="py-12 sm:py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-8">
            How can we help you?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/programs"
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-brand-blue-400 hover:shadow-md transition-all text-center group"
            >
              <span className="text-3xl">🎓</span>
              <span className="font-semibold text-slate-900 group-hover:text-brand-blue-600">I want to train</span>
              <span className="text-sm text-slate-500">Browse free career programs</span>
            </Link>
            <Link
              href="/funding"
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-brand-blue-400 hover:shadow-md transition-all text-center group"
            >
              <span className="text-3xl">💰</span>
              <span className="font-semibold text-slate-900 group-hover:text-brand-blue-600">I need funding</span>
              <span className="text-sm text-slate-500">WIOA, grants, and financial aid</span>
            </Link>
            <Link
              href="/employer"
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-brand-blue-400 hover:shadow-md transition-all text-center group"
            >
              <span className="text-3xl">🏢</span>
              <span className="font-semibold text-slate-900 group-hover:text-brand-blue-600">I&apos;m an employer</span>
              <span className="text-sm text-slate-500">Hire trained, credentialed talent</span>
            </Link>
            <Link
              href="/store"
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-brand-blue-400 hover:shadow-md transition-all text-center group"
            >
              <span className="text-3xl">🏫</span>
              <span className="font-semibold text-slate-900 group-hover:text-brand-blue-600">I run a school</span>
              <span className="text-sm text-slate-500">License the Elevate platform</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 3-CARD VALUE PROPS ===== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {[
              { title: 'Career Opportunities', desc: 'See our career pathways and find the best fit for your future.', href: '/programs', image: '/images/hero/hero-hands-on-training.jpg' },
              { title: 'Funding Available', desc: 'Most programs are 100% free through WIOA, WRG, and JRI funding.', href: '/funding', image: '/images/heroes-hq/funding-hero.jpg' },
              { title: 'Hire Our Graduates', desc: 'Our candidates come out credentialed and ready to work.', href: '/employer', image: '/images/heroes-hq/employer-hero.jpg' },
            ].map((card) => (
              <Link key={card.title} href={card.href} className="group block">
                <Image
                  src={card.image}
                  alt={card.title}
                  width={800}
                  height={533}
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="w-full h-auto rounded-lg"
                />
                <div className="pt-5">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-base text-slate-700 mb-3">{card.desc}</p>
                  <span className="inline-block bg-red-600 text-white font-semibold text-sm px-5 py-2.5 rounded-lg group-hover:bg-red-700 transition-colors">Learn More</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROGRAMS ===== */}
      <section className="py-16 sm:py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">Programs & Pathways</h2>
            <p className="text-lg text-slate-700 max-w-2xl mx-auto">
              Industry-recognized certifications in high-demand fields. Start your new career in weeks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <Link key={program.name} href={program.href} className="group">
                <Image
                  src={program.image}
                  alt={program.name}
                  width={800}
                  height={600}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="w-full h-auto group-hover:opacity-90 transition-opacity duration-300"
                />
                <div className="pt-4">
                  <h3 className="text-slate-900 font-bold text-lg sm:text-xl">{program.name}</h3>
                  <p className="text-slate-600 text-sm sm:text-base mt-1">{program.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/programs" className="inline-block bg-red-600 hover:bg-red-700 text-white text-lg font-bold px-10 py-4 rounded-lg transition-colors">
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
            {[
              { title: 'Register', desc: 'Sign up at indianacareerconnect.com to determine funding eligibility.', href: '/funding', image: '/images/heroes-hq/how-it-works-hero.jpg' },
              { title: 'Choose a Program', desc: 'Pick the career path that fits your goals and schedule.', href: '/programs', image: '/images/heroes-hq/programs-hero.jpg' },
              { title: 'Complete Training', desc: 'Hands-on classes, real experience, earn your certification.', href: '/how-it-works', image: '/images/programs-hq/training-classroom.jpg' },
              { title: 'Get Hired', desc: 'Our employer partners are actively hiring graduates.', href: '/career-services', image: '/images/heroes-hq/career-services-hero.jpg' },
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
                <Link href={step.href} className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
                  Learn More
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FUNDING ===== */}
      <section className="py-16 sm:py-20 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <Image
            src="/images/heroes-hq/jri-hero.jpg"
            alt="Earn while you learn"
            width={1400}
            height={933}
            sizes="(max-width: 768px) 100vw, 960px"
            className="w-full h-auto rounded-lg mb-10"
          />
          <p className="text-red-600 font-bold text-sm mb-2 uppercase tracking-wide">Funding Available</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">100% Tuition-Free Programs</h2>
          <p className="text-lg text-slate-700 mb-8">
            Most programs are fully funded through WIOA, WRG, and JRI. No tuition, no fees, no debt.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            {[
              { label: 'WIOA', desc: 'Covers tuition, books, and supplies for eligible adults and dislocated workers.', href: '/funding/federal-programs', image: '/images/heroes-hq/funding-hero.jpg' },
              { label: 'Workforce Ready Grant', desc: 'Indiana state grant covering high-demand certification programs at no cost.', href: '/funding/state-programs', image: '/images/programs-hq/students-learning.jpg' },
              { label: 'JRI (Justice Reinvestment)', desc: 'Paid apprenticeships and training for justice-involved individuals.', href: '/funding/jri', image: '/images/funding/funding-jri-program-v2.jpg' },
              { label: 'Indiana Career Connect', desc: 'Register to check your eligibility and apply for funding.', href: 'https://indianacareerconnect.com', image: '/images/heroes-hq/career-services-hero.jpg', external: true },
            ].map((item) => (
              <div key={item.label} className="rounded-xl overflow-hidden border border-slate-200">
                <Image src={item.image} alt={item.label} width={600} height={400} className="w-full h-auto" />
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{item.label}</h3>
                  <p className="text-slate-600 text-sm mb-4">{item.desc}</p>
                  <Link
                    href={item.href}
                    {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/wioa-eligibility" className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-lg transition-colors text-center">
              Check Eligibility
            </Link>
            <Link href="/funding" className="border-2 border-red-600 text-red-600 font-bold px-8 py-4 rounded-lg hover:bg-red-50 transition-colors text-center">
              All Funding Options
            </Link>
          </div>
        </div>
      </section>

      {/* ===== PARTNERS ===== */}
      <section className="py-16 sm:py-20 border-t border-slate-100">
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

      {/* ===== EMPLOYERS ===== */}
      <section className="py-16 sm:py-20 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <Image
            src="/images/heroes-hq/employer-hero.jpg"
            alt="Hire our graduates"
            width={1600}
            height={1067}
            sizes="(max-width: 768px) 100vw, 960px"
            className="w-full h-auto rounded-lg mb-10"
          />
          <p className="text-red-600 font-bold text-sm mb-2 uppercase tracking-wide">For Employers</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Hire Our Skilled Graduates</h2>
          <p className="text-lg text-slate-700 mb-8">
            Our candidates come out of our programs credentialed and ready to work. Access tax credits and funding.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            {[
              { label: 'Pre-trained Candidates', desc: 'Certified and ready to work from day one.', href: '/career-services', image: '/images/heroes-hq/success-hero.jpg' },
              { label: 'WOTC Tax Credits', desc: 'Up to $9,600 per hire for qualifying employees.', href: '/employer', image: '/images/programs-hq/business-office.jpg' },
              { label: 'OJT Reimbursement', desc: 'Covers 50-75% of wages during on-the-job training.', href: '/ojt-and-funding', image: '/images/heroes-hq/career-services-hero.jpg' },
              { label: 'Post Jobs Online', desc: 'Browse candidates and post openings through our portal.', href: '/employer', image: '/images/programs-hq/business-training.jpg' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl overflow-hidden border border-slate-200">
                <Image src={item.image} alt={item.label} width={600} height={400} className="w-full h-auto" />
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{item.label}</h3>
                  <p className="text-slate-600 text-sm mb-4">{item.desc}</p>
                  <Link href={item.href} className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
                    Learn More
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/employer" className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-lg transition-colors text-center">
              Employer Portal
            </Link>
            <Link href="/apply/program-holder" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-4 rounded-lg transition-colors text-center">
              Become a Partner
            </Link>
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
