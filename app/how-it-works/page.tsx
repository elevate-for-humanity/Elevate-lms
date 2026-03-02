import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/how-it-works' },
  title: 'How It Works | Elevate For Humanity',
  description: 'From assessment to employment and follow-up support. See exactly how Elevate workforce and employment services work.',
  openGraph: {
    title: 'How It Works | Elevate for Humanity',
    description: 'From assessment to employment and follow-up support. See exactly how Elevate workforce and employment services work.',
    url: 'https://www.elevateforhumanity.org/how-it-works',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/heroes-hq/how-it-works-hero.jpg', width: 1200, height: 630, alt: 'How Elevate career training works' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How It Works | Elevate for Humanity',
    description: 'From assessment to employment and follow-up support.',
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
              From assessment to employment and ongoing support. Training, one-on-one coaching, employer placement, and follow-up — all in one program.
            </p>
          </div>
        </div>
      </section>

      {/* 5 Steps — visual journey */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-5">
            {[
              { step: '1', title: 'Assessment & Intake', desc: 'We start with an individualized assessment to understand your goals, skills, experience, and any barriers to employment. If you qualify for funded training (WIOA, WRG, JRI, or VR), we help you navigate the enrollment process including Indiana Career Connect registration and WorkOne referral.', image: '/images/homepage/funding-navigation.png', cta: 'Check Eligibility', href: '/check-eligibility', external: false },
              { step: '2', title: 'Training & Certification', desc: 'Enroll in an industry-recognized credential program matched to your career goals. Healthcare, skilled trades, CDL, IT, barbering, and more. Programs run 4-16 weeks with instructor oversight. Some programs offer earn-while-you-learn apprenticeship pathways.', image: '/images/homepage/training-program-collage.png', cta: 'View Programs', href: '/programs', external: false },
              { step: '3', title: 'One-on-One Employment Support', desc: 'Every participant receives individualized career coaching throughout the program. This includes resume development, job readiness skills, application assistance, mock interviews, and personalized career planning. Support is adapted to your strengths and needs.', image: '/images/heroes-hq/career-services-hero.jpg', cta: 'Employment Support Services', href: '/employment-support', external: false },
              { step: '4', title: 'Employer Matching & Placement', desc: 'We connect you directly with employers in our hiring network. Staff coordinate introductions, schedule interviews, and support you through the hiring process. We provide employment assistance and employer connection support across healthcare, trades, IT, business, and more.', image: '/images/heroes-hq/employer-hero.jpg', cta: 'Employer Network', href: '/for-employers', external: false },
              { step: '5', title: 'Follow-Up & Retention Support', desc: 'Support does not end at placement. We provide ongoing retention check-ins at 30, 60, 90, and 180 days. If workplace challenges arise, we help you navigate them. Our goal is long-term employment stability and career advancement.', image: '/images/heroes-hq/success-hero.jpg', cta: 'Learn More', href: '/employment-support', external: false },
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

      {/* Inclusive Services Note */}
      <section className="py-10 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
              Support for Individuals with Barriers to Employment
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-4">
              We support individuals with barriers to employment, including individuals
              with disabilities, through individualized workforce and employment support.
              Services are person-centered and adapted to each participant&apos;s strengths,
              goals, and circumstances. We coordinate with vocational rehabilitation
              counselors, workforce agencies, and community organizations to ensure
              participants receive the support they need.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/employment-support" className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold text-sm hover:text-brand-blue-700">
                View Employment Support Services <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold text-sm hover:text-brand-blue-700">
                Contact Us for Referrals <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
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
