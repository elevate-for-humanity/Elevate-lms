import Link from 'next/link';
import Image from 'next/image';
import HomeHeroVideo from './HomeHeroVideo';
import MarqueeBanner from '@/components/MarqueeBanner';

const programs = [
  { 
    name: 'Healthcare', 
    href: '/programs/healthcare', 
    image: '/images/healthcare/healthcare-professional-portrait-1.jpg', 
    description: 'CNA, Medical Assistant, Phlebotomy certifications',
    duration: '8-12 weeks'
  },
  { 
    name: 'Skilled Trades', 
    href: '/programs/skilled-trades', 
    image: '/images/trades/hero-program-hvac.jpg', 
    description: 'HVAC, Electrical, Welding, Plumbing training',
    duration: '12-16 weeks'
  },
  { 
    name: 'Technology', 
    href: '/programs/technology', 
    image: '/images/technology/hero-program-it-support.jpg', 
    description: 'IT Support, Cybersecurity certifications',
    duration: '10-14 weeks'
  },
  { 
    name: 'CDL Training', 
    href: '/programs/cdl', 
    image: '/images/trades/hero-program-cdl.jpg', 
    description: 'Class A and Class B commercial driving',
    duration: '3-6 weeks'
  },
  { 
    name: 'Barbering', 
    href: '/programs/barber-apprenticeship', 
    image: '/images/barber/hero.jpg', 
    description: 'Licensed barber apprenticeship program',
    duration: '12-18 months'
  },
  { 
    name: 'Business', 
    href: '/programs/business', 
    image: '/images/business/professional-1.jpg', 
    description: 'Tax preparation, entrepreneurship training',
    duration: '6-10 weeks'
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ===== MARQUEE BANNER ===== */}
      <MarqueeBanner />

      {/* ===== VIDEO HERO ===== */}
      <section className="relative h-[100svh] min-h-[500px] sm:h-[80vh] sm:min-h-[500px] sm:max-h-[700px]">
        <HomeHeroVideo />
        
        <div className="relative z-10 h-full flex items-center">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6">
                Your Future Starts Here
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white mb-6 sm:mb-8">
                Free career training for eligible Indiana residents. Get certified and hired in weeks.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link 
                  href="/programs"
                  className="bg-brand-red-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-brand-red-700 transition-colors text-center"
                >
                  Explore Programs
                </Link>
                <Link 
                  href="/wioa-eligibility"
                  className="bg-white text-slate-900 px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-slate-100 transition-colors text-center"
                >
                  Check Eligibility
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PARTNERS ===== */}
      <section className="py-6 sm:py-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-slate-500 text-xs sm:text-sm mb-4 sm:mb-6">APPROVED TRAINING PROVIDER</p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-12">
            <Image src="/images/partners/usdol.webp" alt="US Department of Labor" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
            <Image src="/images/partners/dwd.webp" alt="Indiana DWD" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
            <Image src="/images/partners/workone.webp" alt="WorkOne" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
            <Image src="/images/partners/nextleveljobs.webp" alt="Next Level Jobs" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
          </div>
        </div>
      </section>

      {/* ===== PROGRAMS ===== */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">Career Training Programs</h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto px-4">
              Industry-recognized certifications in high-demand fields. Start your new career in weeks.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {programs.map((program) => (
              <Link 
                key={program.name}
                href={program.href}
                className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 hover:border-brand-red-300 hover:shadow-xl transition-all"
              >
                <div className="relative w-full h-36 sm:h-40 md:h-44">
                  <Image
                    src={program.image}
                    alt={program.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-4 sm:p-5 md:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2 group-hover:text-brand-red-600 transition-colors">
                    {program.name}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 mb-3 sm:mb-4">{program.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-slate-500">{program.duration}</span>
                    <span className="text-brand-red-600 font-semibold text-xs sm:text-sm group-hover:underline">
                      Learn More →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-12 sm:py-16 md:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">How It Works</h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600">Four steps to your new career</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm">
              <div className="aspect-square sm:aspect-[4/3] relative">
                <Image src="/images/students-new/student-5.jpg" alt="Check eligibility" fill className="object-cover" />
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 w-8 h-8 sm:w-10 sm:h-10 bg-brand-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base">1</div>
              </div>
              <div className="p-3 sm:p-4 md:p-5">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base md:text-lg mb-1 sm:mb-2">Check Eligibility</h3>
                <p className="text-slate-600 text-xs sm:text-sm hidden sm:block">Quick 2-minute assessment to see if you qualify for free training.</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm">
              <div className="aspect-square sm:aspect-[4/3] relative">
                <Image src="/images/students-new/student-10.jpg" alt="Choose program" fill className="object-cover" />
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 w-8 h-8 sm:w-10 sm:h-10 bg-brand-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base">2</div>
              </div>
              <div className="p-3 sm:p-4 md:p-5">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base md:text-lg mb-1 sm:mb-2">Choose Program</h3>
                <p className="text-slate-600 text-xs sm:text-sm hidden sm:block">Browse programs and select the career path that fits your goals.</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm">
              <div className="aspect-square sm:aspect-[4/3] relative">
                <Image src="/images/students-new/student-15.jpg" alt="Complete training" fill className="object-cover" />
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 w-8 h-8 sm:w-10 sm:h-10 bg-brand-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base">3</div>
              </div>
              <div className="p-3 sm:p-4 md:p-5">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base md:text-lg mb-1 sm:mb-2">Complete Training</h3>
                <p className="text-slate-600 text-xs sm:text-sm hidden sm:block">Attend classes, gain hands-on experience, earn your certification.</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm">
              <div className="aspect-square sm:aspect-[4/3] relative">
                <Image src="/images/students-new/student-18.jpg" alt="Get hired" fill className="object-cover" />
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 w-8 h-8 sm:w-10 sm:h-10 bg-brand-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base">4</div>
              </div>
              <div className="p-3 sm:p-4 md:p-5">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base md:text-lg mb-1 sm:mb-2">Get Hired</h3>
                <p className="text-slate-600 text-xs sm:text-sm hidden sm:block">Connect with employer partners who are actively hiring graduates.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SUCCESS STORIES ===== */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">Success Stories</h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600">Real people who transformed their lives through our programs</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            <div className="aspect-square relative rounded-xl sm:rounded-2xl overflow-hidden">
              <Image src="/images/success-new/success-10.jpg" alt="Graduate" fill className="object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="aspect-square relative rounded-xl sm:rounded-2xl overflow-hidden">
              <Image src="/images/success-new/success-11.jpg" alt="Graduate" fill className="object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="aspect-square relative rounded-xl sm:rounded-2xl overflow-hidden">
              <Image src="/images/success-new/success-12.jpg" alt="Graduate" fill className="object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="aspect-square relative rounded-xl sm:rounded-2xl overflow-hidden">
              <Image src="/images/success-new/success-13.jpg" alt="Graduate" fill className="object-cover hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
          
          <div className="text-center mt-6 sm:mt-8 md:mt-10">
            <Link href="/success" className="text-brand-red-600 font-semibold text-base sm:text-lg hover:underline">
              Read Their Stories →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-12 sm:py-16 md:py-20 bg-brand-red-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">Ready to Start Your New Career?</h2>
          <p className="text-base sm:text-lg md:text-xl text-white mb-6 sm:mb-8 md:mb-10">
            Check your eligibility in 2 minutes. Most students begin training within 2-4 weeks.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link 
              href="/wioa-eligibility"
              className="bg-white text-brand-red-600 px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 rounded-lg font-bold text-base sm:text-lg hover:bg-slate-100 transition-colors"
            >
              Check Eligibility
            </Link>
            <Link 
              href="tel:317-314-3757"
              className="border-2 border-white text-white px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 rounded-lg font-bold text-base sm:text-lg hover:bg-white/10 transition-colors"
            >
              Call (317) 314-3757
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
