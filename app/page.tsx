import Link from 'next/link';
import Image from 'next/image';
import HomeHeroVideo from './HomeHeroVideo';
import MarqueeBanner from '@/components/MarqueeBanner';
import TrustStrip from '@/components/TrustStrip';

const programs = [
  { 
    name: 'Healthcare', 
    href: '/programs/healthcare', 
    image: '/images/homepage/medical-assistant-training.png', 
    description: 'CNA, Medical Assistant, Phlebotomy — get certified and working in weeks',
  },
  { 
    name: 'Skilled Trades', 
    href: '/programs/skilled-trades', 
    image: '/images/homepage/hvac-technician-training.png', 
    description: 'HVAC, Electrical, Welding, Plumbing — hands-on training, real job placement',
  },
  { 
    name: 'Barber Apprenticeship', 
    href: '/programs/barber-apprenticeship', 
    image: '/images/homepage/barber-apprenticeship-training.png', 
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
    image: '/images/technology/cybersecurity-hero.jpg', 
    description: 'IT Support, Cybersecurity — high-demand tech careers',
  },
  { 
    name: 'CPR & First Aid', 
    href: '/programs/cpr-first-aid-hsi', 
    image: '/images/homepage/cpr-aed-first-aid-training.png', 
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
        <div className="absolute inset-0 bg-black/50 z-20" />
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-4 leading-tight tracking-tight">
            FREE CAREER TRAINING
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
            WIOA Funded &bull; Earn While You Learn &bull; Job Placement
          </p>
          <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-3xl">
            Healthcare, Skilled Trades, CDL, Barbering, Technology — get certified and hired in weeks, not years.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/apply/student" className="bg-green-500 hover:bg-green-400 text-white text-xl sm:text-2xl font-black px-10 py-5 rounded-full transition-colors">
              APPLY NOW — IT&apos;S FREE
            </Link>
            <Link href="/programs" className="bg-white/20 hover:bg-white/30 backdrop-blur text-white text-xl sm:text-2xl font-bold px-10 py-5 rounded-full border-2 border-white transition-colors">
              VIEW PROGRAMS
            </Link>
          </div>
        </div>
      </section>

      {/* ===== EARN WHILE YOU LEARN ===== */}
      <section className="py-12 sm:py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 leading-tight">EARN WHILE<br />YOU LEARN</h2>
              <p className="text-xl sm:text-2xl text-white/90 mb-6">
                Get paid during your apprenticeship. Our JRI and WIOA-funded programs cover tuition, supplies, and connect you with employers who hire on the spot.
              </p>
              <p className="text-xl sm:text-2xl text-green-400 font-bold mb-8">
                $0 cost to you. Real certifications. Real jobs.
              </p>
              <Link href="/wioa-eligibility" className="inline-block bg-white text-black text-xl font-bold px-8 py-4 rounded-full hover:bg-green-400 hover:text-black transition-colors">
                CHECK YOUR ELIGIBILITY
              </Link>
            </div>
            <div className="relative h-[350px] sm:h-[400px] rounded-2xl overflow-hidden">
              <Image src="/images/homepage/earn-while-you-learn.png" alt="Earn while you learn - apprenticeship training" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRUST STRIP ===== */}
      <TrustStrip variant="compact" />

      {/* ===== PARTNERS ===== */}
      <section className="py-8 sm:py-10 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-black font-black text-lg sm:text-xl mb-6 tracking-widest uppercase">Approved Training Provider</p>
          <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-14 md:gap-20">
            <Image src="/images/partners/usdol.webp" alt="US Department of Labor" width={64} height={64} className="w-14 h-14 sm:w-16 sm:h-16" />
            <Image src="/images/partners/dwd.webp" alt="Indiana DWD" width={64} height={64} className="w-14 h-14 sm:w-16 sm:h-16" />
            <Image src="/images/partners/workone.webp" alt="WorkOne" width={64} height={64} className="w-14 h-14 sm:w-16 sm:h-16" />
            <Image src="/images/partners/nextleveljobs.webp" alt="Next Level Jobs" width={64} height={64} className="w-14 h-14 sm:w-16 sm:h-16" />
          </div>
        </div>
      </section>

      {/* ===== PROGRAMS ===== */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-black mb-4">TRAINING PROGRAMS</h2>
            <p className="text-xl sm:text-2xl text-black max-w-3xl mx-auto">
              Industry-recognized certifications. Start your new career in weeks.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {programs.map((program) => (
              <Link 
                key={program.name}
                href={program.href}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-2xl transition-all"
              >
                <div className="relative w-full h-48 sm:h-56">
                  <Image src={program.image} alt={program.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl sm:text-2xl font-black text-black mb-2 group-hover:text-brand-red-600 transition-colors">
                    {program.name}
                  </h3>
                  <p className="text-lg text-black mb-4">{program.description}</p>
                  <span className="text-brand-red-600 font-bold text-lg group-hover:underline">
                    Learn More →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/programs" className="inline-block bg-black text-white text-xl font-bold px-10 py-5 rounded-full hover:bg-brand-red-600 transition-colors">
              VIEW ALL PROGRAMS
            </Link>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-black mb-4">HOW IT WORKS</h2>
            <p className="text-xl sm:text-2xl text-black">Four steps to your new career</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '1', title: 'Check Eligibility', desc: 'Quick 2-minute assessment — see if you qualify for free training', img: '/images/homepage/funding-navigation.png' },
              { num: '2', title: 'Choose Program', desc: 'Pick the career path that fits your goals and schedule', img: '/images/homepage/training-program-collage.png' },
              { num: '3', title: 'Complete Training', desc: 'Hands-on classes, real experience, earn your certification', img: '/images/homepage/certificate-of-completion.png' },
              { num: '4', title: 'Get Hired', desc: 'Our employer partners are actively hiring graduates', img: '/images/homepage/employer-partnership.png' },
            ].map((step) => (
              <div key={step.num} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="relative h-48 sm:h-56">
                  <Image src={step.img} alt={step.title} fill className="object-cover" />
                  <div className="absolute top-4 left-4 w-12 h-12 bg-brand-red-600 rounded-xl flex items-center justify-center text-white font-black text-2xl">{step.num}</div>
                </div>
                <div className="p-5">
                  <h3 className="font-black text-black text-xl sm:text-2xl mb-2">{step.title}</h3>
                  <p className="text-black text-base sm:text-lg">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOUNDER ===== */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="relative h-[400px] sm:h-[500px] rounded-2xl overflow-hidden">
              <Image src="/images/team/founder/elizabeth-greene-founder-hero-01.jpg" alt="Elizabeth Greene, Founder of Elevate for Humanity" fill className="object-cover" />
            </div>
            <div>
              <p className="text-lg font-bold text-brand-red-600 mb-2 uppercase tracking-wide">Our Founder</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-black mb-6">Elizabeth Greene</h2>
              <p className="text-xl sm:text-2xl text-black mb-6 leading-relaxed">
                Elizabeth founded Elevate for Humanity to connect everyday people to free workforce training. She also owns Textures Institute of Cosmetology, Greene Staffing Solutions, and Greene Property Management — creating a full ecosystem for training, employment, and housing.
              </p>
              <Link href="/about/team" className="inline-block text-xl font-bold text-brand-red-600 hover:underline">
                Meet the Full Team →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 sm:py-24 bg-brand-red-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-6">START YOUR NEW CAREER TODAY</h2>
          <p className="text-xl sm:text-2xl text-white mb-10">
            Check your eligibility in 2 minutes. Most students begin training within 2-4 weeks.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/apply/student" className="bg-white text-brand-red-600 px-10 py-5 rounded-full font-black text-xl sm:text-2xl hover:bg-green-400 hover:text-black transition-colors">
              APPLY NOW
            </Link>
            <Link href="/wioa-eligibility" className="border-3 border-white text-white px-10 py-5 rounded-full font-bold text-xl sm:text-2xl hover:bg-white/20 transition-colors">
              CHECK ELIGIBILITY
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
