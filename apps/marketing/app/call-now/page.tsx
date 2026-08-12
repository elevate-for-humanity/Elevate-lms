export const revalidate = 3600;

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import HeroPicture from '@/components/marketing/HeroPicture';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Get Started',
  description:
    'Get immediate help with enrollment, programs, funding, and support — all self-service, start everything online.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/call-now',
  },
};

const START_OPTIONS = [
  {
    title: 'Enroll in a Program',
    description:
      'Apply online in minutes. Pick your program, check eligibility, and start training in as little as 2 weeks.',
    href: '/start-trial',
    action: 'Apply Now',
    image: '/images/pages/training-classroom.webp',
    imageAlt: 'Students participating in career training',
  },
  {
    title: 'Ask a Question',
    description:
      'Not sure which program is right for you? Submit an inquiry and get a personalized response within 24 hours.',
    href: '/inquiry',
    action: 'Get Info',
    image: '/images/pages/about-supportive-services.webp',
    imageAlt: 'Student receiving advising and support',
  },
  {
    title: 'Check Funding Eligibility',
    description:
      'See if you qualify for funded training through WIOA, WRG, or Job Ready Indy. Takes less than 2 minutes.',
    href: '/wioa-eligibility',
    action: 'Check Eligibility',
    image: '/images/pages/admin-wioa-hero.webp',
    imageAlt: 'Workforce funding and eligibility support',
  },
  {
    title: 'Employer Partnership',
    description:
      'Hire trained graduates, access tax credits, and post jobs. Set up your employer account online.',
    href: '/employer/dashboard',
    action: 'Partner With Us',
    image: '/images/pages/business-meeting.webp',
    imageAlt: 'Employer and workforce partnership meeting',
  },
  {
    title: 'FAQ & Help Center',
    description:
      'Find answers to common questions about enrollment, funding, programs, certificates, and more.',
    href: '/faq',
    action: 'Browse FAQ',
    image: '/images/pages/about-career-training.webp',
    imageAlt: 'Career training information and learner resources',
  },
  {
    title: 'Technical Support',
    description:
      'Having trouble with your account, courses, or the platform? Submit a support ticket and get help fast.',
    href: '/support',
    action: 'Get Support',
    image: '/images/pages/programs-it-hero.webp',
    imageAlt: 'Technology and online learning support',
  },
] as const;

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Get Started' }]} />
        </div>
      </div>

      <HeroPicture
        src="/images/pages/workforce-training.webp"
        alt="Career training and workforce support at Elevate for Humanity"
        microLabel="Get Started"
        belowHeroHeadline="How Can We Help?"
        belowHeroSubheadline="Everything you need is available online — choose what you need below."
        analyticsName="get-started"
      />

      <section className="py-16" aria-labelledby="get-started-options">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="get-started-options" className="sr-only">
            Get started options
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {START_OPTIONS.map((option) => (
              <Link
                key={option.href}
                href={option.href}
                className="group overflow-hidden rounded-xl border bg-white shadow-sm transition hover:border-brand-blue-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                  <Image
                    src={option.image}
                    alt={option.imageAlt}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="p-8">
                  <h3 className="mb-2 text-xl font-bold text-slate-900 transition-colors group-hover:text-brand-blue-600">
                    {option.title}
                  </h3>
                  <p className="mb-4 text-slate-700">{option.description}</p>
                  <span className="flex items-center gap-2 font-semibold text-brand-blue-600">
                    {option.action} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-8 text-2xl font-bold">Everything Is Self-Service</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              'Apply online in minutes',
              'Check eligibility instantly',
              'Get answers from our FAQ',
              'Submit inquiries 24/7',
              'Track your application status',
              'Enroll and start training',
            ].map((item) => (
              <div key={item} className="flex items-center justify-center gap-2">
                <span className="flex-shrink-0 text-slate-400" aria-hidden="true">
                  •
                </span>
                <span className="text-slate-900">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
