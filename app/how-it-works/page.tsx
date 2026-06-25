import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/how-it-works' },
  title: 'How It Works',
  description:
    'From assessment to employment and follow-up support. See exactly how Elevate workforce and employment services work.',
  openGraph: {
    title: 'How It Works',
    description:
      'From assessment to employment and follow-up support. See exactly how Elevate workforce and employment services work.',
    url: 'https://www.elevateforhumanity.org/how-it-works',
    siteName: PLATFORM_DEFAULTS.orgName,
    images: [
      {
        url: '/images/pages/how-it-works-hero.webp',
        width: 1200,
        height: 630,
        alt: 'How Elevate career training works',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How It Works',
    description: 'From assessment to employment and follow-up support.',
    images: ['/images/pages/how-it-works-hero.webp'],
  },
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'How It Works' }]} />
        </div>
      </div>

      <HeroVideo
        posterImage="/images/pages/how-it-works-hero.webp"
        videoSrcDesktop={heroBanners['how-it-works'].videoSrcDesktop}
        voiceoverSrc={heroBanners['how-it-works'].voiceoverSrc}
        microLabel={heroBanners['how-it-works'].microLabel}
        belowHeroHeadline={heroBanners['how-it-works'].belowHeroHeadline}
        belowHeroSubheadline={heroBanners['how-it-works'].belowHeroSubheadline}
        ctas={[
          heroBanners['how-it-works'].primaryCta,
          heroBanners['how-it-works'].secondaryCta,
        ].filter(Boolean)}
        trustIndicators={heroBanners['how-it-works'].trustIndicators}
        transcript={heroBanners['how-it-works'].transcript}
      />

      {/* 5 Steps — visual journey */}
      <section className="py-8 sm:py-14">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-5">
            {[
              {
                step: '1',
                title: 'Assessment & Intake',
                desc: 'We start with an individualized assessment to understand your goals, skills, experience, and any barriers to employment. If you qualify for funded training (WIOA, WRG, Job Ready Indy, or VR), we help you navigate the enrollment process including Indiana Career Connect registration and WorkOne referral.',
                image: '/images/pages/career-counseling-page-1.webp',
                cta: 'Check Eligibility',
                href: '/check-eligibility',
                external: false,
              },
              {
                step: '2',
                title: 'Training & Certification',
                desc: 'Enroll in an industry-recognized credential program matched to your career goals. Healthcare, skilled trades, CDL, IT, barbering, and more. Programs run 4-16 weeks with instructor oversight. Some programs offer earn-while-you-learn apprenticeship pathways.',
                image: '/images/pages/how-it-works-hero.webp',
                cta: 'View Programs',
                href: '/programs',
                external: false,
              },
              {
                step: '3',
                title: 'One-on-One Employment Support',
                desc: 'Every participant receives individualized career coaching throughout the program. This includes resume development, job readiness skills, application assistance, mock interviews, and personalized career planning. Support is adapted to your strengths and needs.',
                image: '/images/pages/career-services-page-1.webp',
                cta: 'Employment Support Services',
                href: '/employment-support',
                external: false,
              },
              {
                step: '4',
                title: 'Employer Matching & Placement',
                desc: 'We connect you directly with employers in our hiring network. Staff coordinate introductions, schedule interviews, and support you through the hiring process. We provide employment assistance and employer connection support across healthcare, trades, IT, business, and more.',
                image: '/images/pages/about-employer-partners.webp',
                cta: 'Employer Network',
                href: '/for-employers',
                external: false,
              },
              {
                step: '5',
                title: 'Follow-Up & Retention Support',
                desc: 'Support does not end at placement. We provide ongoing retention check-ins at 30, 60, 90, and 180 days. If workplace challenges arise, we help you navigate them. Our goal is long-term employment stability and career advancement.',
                image: '/images/pages/healthcare-grad.jpg',
                cta: 'See Details',
                href: '/employment-support',
                external: false,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex flex-col sm:flex-row gap-0 sm:gap-5 rounded-xl overflow-hidden border border-slate-200 bg-white"
              >
                <div className="relative w-full h-[180px] sm:w-64 sm:h-auto sm:min-h-[200px] flex-shrink-0 overflow-hidden">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="100vw"
                    quality={90}
                    className="object-cover" 
                  />
                </div>
                <div className="p-5 flex-1">
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-3">{item.desc}</p>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-brand-blue-700 transition-colors"
                    >
                      {item.cta} <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-brand-blue-700 transition-colors"
                    >
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
      <section className="py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
              Support for Individuals with Barriers to Employment
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-4">
              We support individuals with barriers to employment, including individuals with
              disabilities, through individualized workforce and employment support. Services are
              person-centered and adapted to each participant&apos;s strengths, goals, and
              circumstances. We coordinate with vocational rehabilitation counselors, workforce
              agencies, and community organizations to ensure participants receive the support they
              need.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/employment-support"
                className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold text-sm hover:text-brand-blue-700"
              >
                View Employment Support Services <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold text-sm hover:text-brand-blue-700"
              >
                Contact Us for Referrals <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 sm:py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">Ready to Begin?</h2>
          <p className="text-slate-900 mb-6 text-sm">
            Register at Indiana Career Connect to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-brand-blue-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-blue-50 transition-colors text-center"
            >
              Register Now <ArrowRight className="w-4 h-4 inline ml-1" />
            </a>
            <Link
              href="/start"
              className="border-2 border-white text-slate-900 font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center"
            >
              Apply for Training
            </Link>
            <Link
              href="/booking/enrollment"
              className="border-2 border-white/60 text-slate-900/90 font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center"
            >
              Book Enrollment Session
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
