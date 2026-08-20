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
    'Get help with enrollment, programs, funding review, and support. Program admission and funding decisions depend on the requirements that apply to each participant and program.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/call-now',
  },
};

const START_OPTIONS = [
  {
    title: 'Apply to a Program',
    description:
      'Submit the student application, review the exact program requirements, and complete the admission, payment, funding-authorization, and onboarding steps that apply.',
    href: '/apply/student',
    action: 'Start Application',
    image: '/images/pages/training-classroom.webp',
    imageAlt: 'Students participating in career training',
  },
  {
    title: 'Ask a Question',
    description:
      'Not sure which program is right for you? Submit an inquiry so the admissions team can review your question and respond.',
    href: '/inquiry',
    action: 'Get Info',
    image: '/images/pages/career-counseling.jpg',
    imageAlt: 'Student receiving advising and support',
  },
  {
    title: 'Review Funding Eligibility',
    description:
      'Complete a preliminary eligibility review, then confirm any WIOA, Workforce Ready Grant, employer, or other third-party funding with the responsible agency. The website does not issue funding approval.',
    href: '/check-eligibility',
    action: 'Review Eligibility',
    image: '/images/pages/admin-wioa-hero.webp',
    imageAlt: 'Workforce funding and eligibility support',
  },
  {
    title: 'Employer Partnership',
    description:
      'Learn about hiring, apprenticeship host-site participation, work-based learning, and employer training pathways. Incentives and reimbursements require separate eligibility and authorization.',
    href: '/employers',
    action: 'Employer Information',
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
      'Having trouble with your account, courses, or the platform? Submit a support request for technical assistance.',
    href: '/support',
    action: 'Get Support',
    image: '/images/pages/contact-hero.jpg',
    imageAlt: 'Technical support specialist helping with an online account',
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
        belowHeroSubheadline="Choose the application, information, funding-review, employer, or support path you need."
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
                  <h3 className="mb-2 text-xl font-bold text-slate-950 transition-colors group-hover:text-brand-blue-700">
                    {option.title}
                  </h3>
                  <p className="mb-4 text-slate-800">{option.description}</p>
                  <span className="flex items-center gap-2 font-semibold text-brand-blue-700">
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
          <h2 className="mb-8 text-2xl font-bold text-slate-950">What You Can Do Online</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              'Submit an application',
              'Complete a preliminary eligibility review',
              'Review program and funding information',
              'Submit inquiries and support requests',
              'Track available application status information',
              'Complete required onboarding steps',
            ].map((item) => (
              <div key={item} className="flex items-center justify-center gap-2">
                <span className="flex-shrink-0 text-slate-600" aria-hidden="true">
                  •
                </span>
                <span className="text-slate-950">{item}</span>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-sm leading-6 text-slate-600">
            Preliminary website tools do not create admission, funding, certification, licensure,
            employment, or benefit eligibility. Those outcomes depend on the program and the
            responsible approving organization.
          </p>
        </div>
      </section>
    </div>
  );
}
