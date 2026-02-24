import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/how-it-works' },
  title: 'How It Works | Elevate For Humanity',
  description: 'From registration to employment in 5 steps. See exactly how Elevate career training works.',
  openGraph: {
    title: 'How It Works | Elevate for Humanity',
    description: 'From registration to employment in 5 steps. See exactly how Elevate career training works.',
    url: 'https://www.elevateforhumanity.org/how-it-works',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/heroes-hq/how-it-works-hero.jpg', width: 1200, height: 630, alt: 'How Elevate career training works' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How It Works | Elevate for Humanity',
    description: 'From registration to employment in 5 steps.',
    images: ['/images/heroes-hq/how-it-works-hero.jpg'],
  },
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'How It Works' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/hero-images/how-it-works-hero.jpg" alt="How Elevate works" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">How It Works</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              From signup to your new career in 5 clear steps. No confusion, no runaround.
            </p>
          </div>
        </div>
      </section>

      {/* 5 Steps — visual journey */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-5">
            {[
              { step: '1', title: 'Register at Indiana Career Connect', desc: 'Create a free account at indianacareerconnect.com. This is the state workforce portal — it takes about 10 minutes. You will need your ID and Social Security number.', image: '/images/homepage/funding-navigation.png', cta: 'Register Now', href: 'https://www.indianacareerconnect.com', external: true },
              { step: '2', title: 'Schedule a WorkOne Appointment', desc: 'Call or visit your local WorkOne center to schedule an eligibility meeting. A case manager will review your situation and determine which funding programs you qualify for (WIOA, WRG, JRI).', image: '/images/heroes-hq/how-it-works-hero.jpg', cta: 'Find WorkOne Locations', href: 'https://www.in.gov/dwd/workone/workone-locations/', external: true },
              { step: '3', title: 'Choose Your Program', desc: 'Browse our training programs and pick the career path that fits your goals. Healthcare, skilled trades, CDL, IT, barbering, and more. Your WorkOne case manager can help you decide.', image: '/images/homepage/training-program-collage.png', cta: 'View Programs', href: '/programs', external: false },
              { step: '4', title: 'Complete Training & Get Certified', desc: 'Attend classes, complete hands-on training, and earn your industry certification. Most programs take 4-16 weeks. Some programs let you earn while you learn through apprenticeships.', image: '/images/homepage/certificate-of-completion.png', cta: 'Learn About Earn While You Learn', href: '/ojt-and-funding', external: false },
              { step: '5', title: 'Get Hired', desc: 'Our career services team helps you build your resume, practice interviews, and connects you directly with employers who are hiring. Employment outcomes vary by program and market conditions.', image: '/images/industries/technology.jpg', cta: 'Career Services', href: '/career-services', external: false },
            ].map((item) => (
              <div key={item.step} className="flex flex-col sm:flex-row gap-0 sm:gap-5 rounded-xl overflow-hidden border border-slate-200 bg-white">
                <div className="relative w-full h-[180px] sm:w-64 sm:h-auto sm:min-h-[200px] flex-shrink-0">
                  <Image src={item.image} alt={item.title} fill sizes="100vw" quality={90} className="object-cover" />
                  
                </div>
                <div className="p-5 flex-1">
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-3">{item.desc}</p>
                  {item.external ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-brand-blue-700 transition-colors">
                      {item.cta} <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <Link href={item.href}
                      className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-brand-blue-700 transition-colors">
                      {item.cta} <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 sm:py-14 bg-brand-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Ready to Begin?</h2>
          <p className="text-white mb-6 text-sm">Register at Indiana Career Connect to get started.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer"
              className="bg-white text-brand-blue-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-blue-50 transition-colors text-center">
              Register Now <ArrowRight className="w-4 h-4 inline ml-1" />
            </a>
            <Link href="/apply" className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center">
              Apply for Training
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
