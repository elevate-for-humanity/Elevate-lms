import Link from 'next/link';
import Image from 'next/image';
import HomeHeroVideo from './HomeHeroVideo';

const programs = [
  { 
    name: 'Healthcare', 
    href: '/programs/healthcare', 
    image: '/images/healthcare/hero-program-medical-assistant.jpg', 
    description: 'CNA, Medical Assistant, Phlebotomy certifications',
    duration: '8-12 weeks',
    salary: '$35,000 - $45,000'
  },
  { 
    name: 'Skilled Trades', 
    href: '/programs/skilled-trades', 
    image: '/images/trades/program-hvac-technician.jpg', 
    description: 'HVAC, Electrical, Welding, Plumbing training',
    duration: '12-16 weeks',
    salary: '$40,000 - $65,000'
  },
  { 
    name: 'Technology', 
    href: '/programs/technology', 
    image: '/images/technology/program-it-support-training.jpg', 
    description: 'IT Support, Cybersecurity certifications',
    duration: '10-14 weeks',
    salary: '$45,000 - $70,000'
  },
  { 
    name: 'CDL Training', 
    href: '/programs/cdl', 
    image: '/images/trades/hero-program-cdl.jpg', 
    description: 'Class A and Class B commercial driving',
    duration: '3-6 weeks',
    salary: '$50,000 - $80,000'
  },
  { 
    name: 'Barbering', 
    href: '/programs/barber-apprenticeship', 
    image: '/images/barber/training.jpg', 
    description: 'Licensed barber apprenticeship program',
    duration: '12-18 months',
    salary: '$30,000 - $60,000'
  },
  { 
    name: 'Business', 
    href: '/programs/business', 
    image: '/images/business/program-tax-preparation.jpg', 
    description: 'Tax preparation, entrepreneurship training',
    duration: '6-10 weeks',
    salary: '$35,000 - $55,000'
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ===== VIDEO HERO WITH AVATAR ===== */}
      <section className="relative h-[100svh] min-h-[600px] sm:h-[85vh] sm:min-h-[600px] sm:max-h-[800px]">
        <HomeHeroVideo />
        
        {/* Avatar overlay - bottom right */}
        <div className="absolute bottom-8 right-8 z-20 hidden md:block">
          <div className="w-72 lg:w-80 rounded-2xl overflow-hidden shadow-2xl bg-slate-900/90 backdrop-blur-sm">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full aspect-video object-cover"
            >
              <source src="/videos/avatars/home-welcome.mp4" type="video/mp4" />
            </video>
            <div className="p-4">
              <p className="text-white font-semibold text-sm">Welcome to Elevate</p>
              <p className="text-slate-400 text-xs">Free career training for Indiana residents</p>
            </div>
          </div>
        </div>

        {/* Minimal CTA buttons - bottom left */}
        <div className="absolute bottom-8 left-8 z-20">
          <div className="flex flex-col sm:flex-row gap-3">
            <Link 
              href="/apply"
              className="bg-brand-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-brand-red-700 transition-all hover:scale-105 text-center shadow-lg"
            >
              Apply Now — It's Free
            </Link>
            <Link 
              href="/programs"
              className="bg-white/20 backdrop-blur-sm border-2 border-white/50 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/30 transition-all text-center"
            >
              Explore Programs
            </Link>
          </div>
        </div>
      </section>

      {/* ===== WHAT WE DO ===== */}
      <section className="py-16 sm:py-20 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-brand-red-600 font-semibold text-sm mb-3 tracking-wide">WHO WE ARE</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            We Help Hoosiers Build Real Careers
          </h2>
          <p className="text-lg text-slate-600 mb-6 leading-relaxed">
            <strong>Elevate for Humanity</strong> is a nonprofit workforce development organization 
            based in Indianapolis. We connect Indiana residents with free career training, 
            paid apprenticeships, and direct pathways to employment.
          </p>
          <p className="text-lg text-slate-600 mb-6 leading-relaxed">
            Our programs are funded through partnerships with the <strong>Indiana Department of 
            Workforce Development</strong>, <strong>WorkOne</strong>, and the <strong>Justice 
            Reinvestment Initiative (JRI)</strong>—meaning qualified participants pay nothing 
            for training, certifications, or job placement assistance.
          </p>
          <div className="flex justify-center gap-8 mt-10">
            <div className="text-center">
              <p className="text-4xl font-bold text-brand-red-600">500+</p>
              <p className="text-slate-600">Graduates Employed</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-brand-red-600">85%</p>
              <p className="text-slate-600">Job Placement Rate</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-brand-red-600">$0</p>
              <p className="text-slate-600">Cost to You</p>
            </div>
          </div>
          <Link 
            href="/about"
            className="inline-flex items-center text-brand-red-600 font-semibold text-lg hover:text-brand-red-700 group mt-8"
          >
            Learn More About Our Mission
            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ===== EARN WHILE YOU LEARN ===== */}
      <section className="py-16 sm:py-20 md:py-24 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-brand-red-400 font-semibold text-sm mb-3 tracking-wide">EARN WHILE YOU LEARN</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Get Paid During Your Training
          </h2>
          <p className="text-lg text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto">
            Many of our programs offer <strong className="text-white">paid apprenticeships</strong> where 
            you earn a paycheck while gaining hands-on experience. You&apos;re not just learning—you&apos;re 
            building your career from day one.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">$</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Paid Training</h3>
              <p className="text-slate-400">Earn $15-$20/hour while you learn</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">✓</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Free Certifications</h3>
              <p className="text-slate-400">All exam fees and materials covered</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">→</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Job Placement</h3>
              <p className="text-slate-400">85% employed within 90 days</p>
            </div>
          </div>
          <Link 
            href="/apprenticeships"
            className="inline-flex items-center bg-brand-red-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-brand-red-700 transition-all"
          >
            View Apprenticeship Programs
          </Link>
        </div>
      </section>

      {/* ===== FUNDING & ELIGIBILITY ===== */}
      <section className="py-16 sm:py-20 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-brand-red-600 font-semibold text-sm mb-3 tracking-wide">HOW IT'S FUNDED</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Training at No Cost to You
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Our programs are funded through state and federal workforce initiatives. 
              If you qualify, your entire training is covered—including tuition, books, 
              certifications, and even supportive services.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* JRI Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-slate-100">
              <div className="aspect-[16/9] relative">
                <Image 
                  src="/images/funding/funding-jri-program-v2.jpg" 
                  alt="Justice Reinvestment Initiative" 
                  fill 
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-3">Justice Reinvestment Initiative (JRI)</h3>
                <p className="text-slate-600 mb-4">
                  Indiana&apos;s JRI program provides funding for individuals with justice involvement 
                  to access career training and reentry support. Get a fresh start with marketable skills.
                </p>
                <Link href="/jri" className="text-brand-red-600 font-semibold hover:underline">
                  Learn about JRI eligibility →
                </Link>
              </div>
            </div>

            {/* WorkOne Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-slate-100">
              <div className="aspect-[16/9] relative">
                <Image 
                  src="/images/funding/funding-dol-program-v2.jpg" 
                  alt="WorkOne WIOA Funding" 
                  fill 
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-3">WorkOne / WIOA Funding</h3>
                <p className="text-slate-600 mb-4">
                  The Workforce Innovation and Opportunity Act provides training funds for 
                  unemployed, underemployed, and low-income Indiana residents seeking new careers.
                </p>
                <Link href="/wioa-eligibility" className="text-brand-red-600 font-semibold hover:underline">
                  Check your eligibility →
                </Link>
              </div>
            </div>

            {/* Next Level Jobs Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-slate-100">
              <div className="aspect-[16/9] relative">
                <Image 
                  src="/images/healthcare/hero-healthcare-professionals.jpg" 
                  alt="Next Level Jobs" 
                  fill 
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-3">Next Level Jobs</h3>
                <p className="text-slate-600 mb-4">
                  Indiana&apos;s Next Level Jobs program covers training costs for high-demand 
                  careers in healthcare, IT, advanced manufacturing, and transportation.
                </p>
                <Link href="/next-level-jobs" className="text-brand-red-600 font-semibold hover:underline">
                  See qualifying programs →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROGRAMS ===== */}
      <section className="py-16 sm:py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-brand-red-600 font-semibold text-sm mb-3 tracking-wide">OUR PROGRAMS</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Career Training That Works
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Industry-recognized certifications in high-demand fields. 
              Most programs complete in 3-16 weeks—not years.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {programs.map((program) => (
              <Link 
                key={program.name}
                href={program.href}
                className="group bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <Image
                    src={program.image}
                    alt={program.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-brand-red-600 transition-colors">{program.name}</h3>
                  <p className="text-slate-600 text-sm mb-4">{program.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-slate-500">Duration</p>
                      <p className="text-slate-900 font-medium">{program.duration}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500">Avg. Salary</p>
                      <p className="text-green-600 font-medium">{program.salary}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-brand-red-600 font-semibold text-sm group-hover:underline flex items-center">
                      Learn More →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link 
              href="/programs"
              className="inline-flex items-center bg-slate-900 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-slate-800 transition-all"
            >
              View All Programs
            </Link>
          </div>
        </div>
      </section>



      {/* ===== CTA ===== */}
      <section className="py-16 sm:py-20 md:py-24 bg-brand-red-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your New Career?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Take the first step today. Check your eligibility in 2 minutes, 
            or call us to speak with an enrollment advisor.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/apply"
              className="bg-white text-brand-red-600 px-10 py-5 rounded-lg font-bold text-lg hover:bg-slate-100 transition-all hover:scale-105 shadow-lg"
            >
              Apply Now — Free
            </Link>
            <Link 
              href="tel:317-314-3757"
              className="border-2 border-white text-white px-10 py-5 rounded-lg font-bold text-lg hover:bg-white/10 transition-all"
            >
              Call (317) 314-3757
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
