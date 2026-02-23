import Link from 'next/link';
import Image from 'next/image';


import HomeHeroVideo from './HomeHeroVideo';
import { InView } from '@/components/ui/InView';
import { AuthorityBanner } from '@/components/InstitutionalAuthority';

// Quiz removed — program cards now serve as the path selector

const programs = [
  { name: 'Healthcare', href: '/programs/healthcare', image: '/images/programs-hq/healthcare-hero.webp', desc: 'CNA, Medical Assistant, Phlebotomy' },
  { name: 'Skilled Trades', href: '/programs/skilled-trades', image: '/images/programs-hq/skilled-trades-hero.webp', desc: 'HVAC, Electrical, Welding, Plumbing' },
  { name: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship', image: '/images/barber-hero-new.webp', desc: 'Paid apprenticeship — earn while you learn' },
  { name: 'CDL Training', href: '/programs/cdl', image: '/images/cdl-vibrant.webp', desc: 'Class A & B — start earning $50K+' },
  { name: 'Technology', href: '/programs/technology', image: '/images/programs-hq/it-support.webp', desc: 'IT Support, Cybersecurity' },
  { name: 'CPR & First Aid', href: '/programs/cpr-first-aid-hsi', image: '/images/healthcare/healthcare-professional-portrait-1.webp', desc: 'HSI certified — same-day available' },
];



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

      {/* ===== HERO ===== */}
      <section className="relative">
        <div className="relative h-[60vh] min-h-[400px] max-h-[600px]">
          <HomeHeroVideo />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-[1.05]">
              Free Training Programs — Learn, Certify, Work
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 mt-4 leading-relaxed max-w-2xl mx-auto">
              WIOA-funded career training in healthcare, skilled trades, CDL, and technology. Zero tuition for eligible Indiana residents.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <Link href="/apply/student" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-lg text-lg transition-colors">
                Apply Now — It&apos;s Free
              </Link>
              <Link href="/programs" className="border-2 border-white/30 text-white font-bold px-8 py-4 rounded-lg text-lg hover:bg-white/10 transition-colors">
                Browse Programs
              </Link>
            </div>
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
              { href: '/programs', label: 'I want to train', desc: 'Browse funded programs in healthcare, trades, CDL, and tech.', cta: 'Browse Programs', icon: '🎓' },
              { href: '/funding', label: 'I need funding', desc: 'Most programs are tuition-free. Check your eligibility.', cta: 'Check Eligibility', icon: '💰' },
              { href: '/employer', label: "I'm an employer", desc: 'Hire credentialed graduates. Access WOTC tax credits.', cta: 'Hire Graduates', icon: '🏢' },
              { href: '/store', label: 'I run a school', desc: 'License the Elevate platform for your organization.', cta: 'Get Licensed', icon: '🏫' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col p-5 bg-white rounded-xl border-2 border-slate-200 hover:border-brand-red-400 hover:shadow-md transition-all group"
              >
                <span className="text-3xl mb-3">{item.icon}</span>
                <span className="font-bold text-lg text-slate-900 mb-1">{item.label}</span>
                <span className="text-sm text-slate-600 mb-4 flex-1">{item.desc}</span>
                <span className="text-brand-red-600 font-semibold text-sm group-hover:underline">
                  {item.cta} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      </InView>

      {/* ===== INSTITUTIONAL AUTHORITY ===== */}
      <AuthorityBanner />



      {/* ===== WHAT KIND OF WORK EXCITES YOU ===== */}
      <InView animation="fade-up">
      <section aria-label="Programs and pathways" className="py-14 sm:py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Choose Your Path</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">What Kind of Work Excites You?</h2>
            <p className="text-lg text-slate-700 max-w-2xl mx-auto">
              Pick a field and start training in weeks. Most programs are fully funded.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <Link key={program.name} href={program.href} className="group bg-white rounded-xl border-2 border-slate-200 hover:border-brand-red-400 hover:shadow-lg transition-all overflow-hidden">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={program.image}
                    alt={program.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-slate-900 font-bold text-lg sm:text-xl mb-1">{program.name}</h3>
                  <p className="text-slate-600 text-sm mb-4">{program.desc}</p>
                  <span className="inline-block bg-brand-red-600 text-white font-semibold text-sm px-5 py-2.5 rounded-lg group-hover:bg-brand-red-700 transition-colors">
                    Explore Program &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/programs" className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white text-lg font-bold px-10 py-4 rounded-lg transition-colors">
              View All Programs
            </Link>
          </div>
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
              { title: 'Apply Online', desc: 'Fill out a short application — takes about 5 minutes. No account needed.', href: '/apply/student', image: '/images/workforce-1.webp' },
              { title: 'Choose a Program', desc: 'Pick the career path that fits your goals and schedule.', href: '/programs', image: '/images/Content_PATHWAY_TRADES.webp' },
              { title: 'Complete Training', desc: 'Hands-on classes, real experience, earn your certification.', href: '/how-it-works', image: '/images/workforce-2.webp' },
              { title: 'Get Hired', desc: 'Our employer partners are actively hiring graduates.', href: '/career-services', image: '/images/workforce-3.webp' },
            ].map((step) => (
              <div key={step.title} className="text-center">
                <Image
                  src={step.image}
                  alt={step.title}
                  width={800}
                  height={533}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
          <p className="text-brand-red-600 font-bold text-sm mb-2 uppercase tracking-wide">Funding Available</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">100% Tuition-Free Programs</h2>
          <p className="text-lg text-slate-700 mb-8">
            Most programs are fully funded through WIOA, WRG, and JRI. No tuition, no fees, no debt.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            {[
              { label: 'WIOA', desc: 'Covers tuition, books, and supplies for eligible adults and dislocated workers.', href: '/funding/federal-programs', image: '/images/community-healthcare-worker.webp' },
              { label: 'Workforce Ready Grant', desc: 'Indiana state grant covering high-demand certification programs at no cost for eligible participants.', href: '/funding/state-programs', image: '/images/heroes-hq/funding-hero.webp' },
              { label: 'JRI (Justice Reinvestment)', desc: 'Paid apprenticeships and training for justice-involved individuals.', href: '/funding/jri', image: '/images/funding/funding-jri-program.webp' },
              { label: 'Indiana Career Connect', desc: 'Register to check your eligibility and apply for funding.', href: 'https://indianacareerconnect.com', image: '/images/homepage/government-agencies.webp', external: true },
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



      {/* ===== EMPLOYERS ===== */}
      <InView animation="fade-up">
      <section aria-label="Employer partnerships" className="py-10 sm:py-14 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-brand-red-600 font-bold text-sm mb-2 uppercase tracking-wide">For Employers</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Hire Our Skilled Graduates</h2>
          <p className="text-lg text-slate-700 mb-8">
            Our candidates come out of our programs credentialed and ready to work. Access tax credits and funding.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            {[
              { label: 'Pre-trained Candidates', desc: 'Every graduate holds an industry-recognized credential and has completed hands-on training. Background checks and drug screening are completed where required by employer or program.', href: '/career-services', image: '/images/programs-hq/students-learning.webp' },
              { label: 'WOTC Tax Credits', desc: 'The Work Opportunity Tax Credit gives employers $2,400 per qualifying hire (up to $9,600 for qualified veterans). Targeted groups include formerly incarcerated, TANF/SNAP recipients, and long-term unemployed. We help file Form 8850 within the 28-day deadline.', href: '/employer', image: '/images/programs-hq/business-training.webp' },
              { label: 'OJT Reimbursement', desc: 'On-the-Job Training funding reimburses 50-75% of a new hire\'s wages during their training period. You train them your way while the workforce board covers most of the cost.', href: '/ojt-and-funding', image: '/images/heroes-hq/employer-hero.webp' },
              { label: 'Post Jobs Online', desc: 'List your open positions directly on our job board. Our career services team matches your requirements with qualified graduates and sends you pre-screened candidates.', href: '/employer', image: '/images/artlist/cropped/hero-training-8-wide.webp' },
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
