import Link from 'next/link';
import Image from 'next/image';
import HomeHeroVideo from './HomeHeroVideo';
import MarqueeBanner from '@/components/MarqueeBanner';
import PageAvatar from '@/components/PageAvatar';
import TrustStrip from '@/components/TrustStrip';

const programs = [
  { 
    name: 'Healthcare', 
    href: '/programs/healthcare', 
    image: '/images/heroes/programs/healthcare/hero-program-medical-assistant.jpg', 
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
    image: '/images/courses/cpr-aed-first-aid-10002448-cover.jpg', 
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
              <Image src="/images/hero-hands-on-training.jpg" alt="Hands-on career training" fill className="object-cover object-center" sizes="(max-width: 768px) 100vw, 50vw" />
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

      {/* ===== TRUST STRIP ===== */}
      <TrustStrip variant="compact" />

      {/* ===== PARTNERS ===== */}
      <section className="py-12 bg-white border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-slate-500 font-semibold text-base mb-8 tracking-widest uppercase">Approved Training Provider</p>
          <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-14 md:gap-20">
            <a href="https://www.dol.gov" target="_blank" rel="noopener noreferrer">
              <Image src="/images/partners/usdol.webp" alt="US Department of Labor" width={80} height={80} className="w-16 h-16 sm:w-20 sm:h-20 grayscale hover:grayscale-0 transition-all duration-300" />
            </a>
            <a href="https://www.in.gov/dwd" target="_blank" rel="noopener noreferrer">
              <Image src="/images/partners/dwd.webp" alt="Indiana DWD" width={80} height={80} className="w-16 h-16 sm:w-20 sm:h-20 grayscale hover:grayscale-0 transition-all duration-300" />
            </a>
            <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer">
              <Image src="/images/partners/workone.webp" alt="WorkOne" width={80} height={80} className="w-16 h-16 sm:w-20 sm:h-20 grayscale hover:grayscale-0 transition-all duration-300" />
            </a>
            <a href="https://nextleveljobs.org" target="_blank" rel="noopener noreferrer">
              <Image src="/images/partners/nextleveljobs.webp" alt="Next Level Jobs" width={80} height={80} className="w-16 h-16 sm:w-20 sm:h-20 grayscale hover:grayscale-0 transition-all duration-300" />
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
                className="group bg-white rounded-2xl overflow-hidden border border-stone-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative w-full aspect-[4/3] bg-stone-100">
                  <Image src={program.image} alt={program.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover object-center group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-black mb-2 group-hover:text-brand-red-600 transition-colors">
                    {program.name}
                  </h3>
                  <p className="text-lg text-slate-600 mb-4">{program.description}</p>
                  <span className="text-brand-red-600 font-semibold text-lg group-hover:underline">
                    Learn More →
                  </span>
                </div>
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

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-16 sm:py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black mb-4">How It Works</h2>
            <p className="text-xl text-slate-600">Four steps to your new career</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[
              { num: '1', title: 'Register at WorkOne', desc: 'Sign up at indianacareerconnect.com and schedule an appointment with WorkOne to determine your funding eligibility', img: '/images/heroes-hq/funding-hero.jpg', href: '/funding', linkLabel: 'Learn More' },
              { num: '2', title: 'Choose Program', desc: 'Pick the career path that fits your goals and schedule', img: '/images/heroes-hq/programs-hero.jpg', href: '/programs', linkLabel: 'View Programs' },
              { num: '3', title: 'Complete Training', desc: 'Hands-on classes, real experience, earn your certification', img: '/images/hero/hero-certifications.jpg', href: '/how-it-works', linkLabel: 'Learn More' },
              { num: '4', title: 'Get Hired', desc: 'Our employer partners are actively hiring graduates', img: '/images/heroes/success-story-1.jpg', href: '/career-services', linkLabel: 'Career Services' },
            ].map((step) => (
              <div key={step.num} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-lg transition-shadow duration-300">
                <div className="relative aspect-[4/3] bg-stone-100">
                  <Image src={step.img} alt={step.title} fill className="object-cover object-center" sizes="(max-width: 640px) 50vw, 25vw" />
                  <div className="absolute top-3 left-3 w-10 h-10 bg-brand-red-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">{step.num}</div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-black text-lg sm:text-xl mb-2">{step.title}</h3>
                  <p className="text-slate-600 text-base sm:text-lg mb-3">{step.desc}</p>
                  <Link href={step.href} className="text-brand-red-600 font-semibold text-sm hover:underline">
                    {step.linkLabel} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOUNDER ===== */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-stone-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] sm:h-[480px] rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/5">
              <Image src="/images/team/founder/elizabeth-greene-founder-hero-01.jpg" alt="Elizabeth Greene, Founder of Elevate for Humanity" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <div>
              <p className="text-brand-red-600 font-bold text-lg mb-2 tracking-wide uppercase">Our Founder</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black mb-6">Elizabeth Greene</h2>
              <p className="text-xl text-slate-700 mb-6 leading-relaxed">
                Elizabeth founded Elevate for Humanity to connect everyday people to workforce training. She also owns Textures Institute of Cosmetology, Greene Staffing Solutions, and Greene Property Management — creating a full ecosystem for training, employment, and housing.
              </p>
              <Link href="/about/team" className="inline-block text-lg font-bold text-brand-red-600 hover:text-brand-red-700 hover:underline transition-colors">
                Meet the Full Team →
              </Link>
            </div>
          </div>
        </div>
      </section>

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
