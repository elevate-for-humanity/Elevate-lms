import HvacTrainingShowcase from '@/components/programs/HvacTrainingShowcase';
import ProgramGuideResources from '@/components/resources/ProgramGuideResources';
// Keep the homepage focused on training, the featured shops, and enrollment.
// Detailed platform operations remain on the dedicated platform pages.
import type { Metadata } from 'next';
import Link from 'next/link';
import { HomeHowItWorks } from '@/components/home/HomeHowItWorks';
import { HomeCareerPathways } from '@/components/home/HomeCareerPathways';
import { HomeSocialAppCTA } from '@/components/home/HomeSocialAppCTA';
import { HomeFinalCTA } from '@/components/home/HomeFinalCTA';
import { PlatformHubHero } from '@/components/home/PlatformHubHero';
import { HomeFeaturedHostShop } from '@/components/home/HomeFeaturedHostShop';
import { HomePlatformOverview } from '@/components/home/HomePlatformOverview';
import { HomeEmployerStrip } from '@/components/home/HomeEmployerStrip';
import { HomeFunding } from '@/components/home/HomeFunding';
import { HomeWebsiteBuilderSales } from '@/components/home/HomeWebsiteBuilderSales';
import { HomeInstitutionalGateway } from '@/components/home/HomeInstitutionalGateway';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import StructuredData from '@/components/StructuredData';
import { WORKONE_INDY_BOOKING_URL } from '@/lib/workone/booking';
import { ROUTES } from '@/lib/navigation/routes';

export const revalidate = 300;

export const metadata: Metadata = {
  title: {
    absolute: `${PLATFORM_DEFAULTS.orgName} | Workforce Training & Apprenticeship Platform`,
  },
  description:
    'Career training, registered apprenticeships, employer coordination, credentials, compliance, and participant progress.',
  alternates: { canonical: 'https://www.elevateforhumanity.org' },
  openGraph: {
    title: `${PLATFORM_DEFAULTS.orgName} | Career Training & Apprenticeships`,
    description:
      'Career training, registered apprenticeships, testing, credentials, employer connections, and workforce technology.',
    url: 'https://www.elevateforhumanity.org',
    siteName: PLATFORM_DEFAULTS.orgName,
    locale: 'en_US',
    images: [
      {
        url: 'https://www.elevateforhumanity.org/images/refresh-20261014/home.webp',
        alt: `Illustrative ${PLATFORM_DEFAULTS.orgName} workforce institute exterior`,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PLATFORM_DEFAULTS.orgName} | Career Training & Apprenticeships`,
    description:
      'Explore career training, registered apprenticeships, Host Shops, and employer-connected pathways across Indiana.',
    images: ['https://www.elevateforhumanity.org/images/refresh-20261014/home.webp'],
  },
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <main
        data-homepage-curation="20261004"
        className="[&_a]:no-underline [&_a:hover]:no-underline"
      >
        <PlatformHubHero />
        <HomeFeaturedHostShop />
        <HomeCareerPathways />
        <HvacTrainingShowcase compact />
        <HomeHowItWorks />
        <section className="bg-slate-50 px-5 py-12" aria-labelledby="tax-home-cta">
          <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-8">
            <p className="text-sm font-semibold text-sky-800">Supersonic Fast Cash</p>
            <h2 id="tax-home-cta" className="mt-3 text-3xl font-bold text-slate-950">
              Get your taxes prepared. Start your own tax office.
            </h2>
            <p className="mt-4 max-w-2xl text-slate-600">
              Get help with your taxes, ask about free tax preparation eligibility, or explore how
              to build your own tax business.
            </p>
            <Link
              href="/tax"
              className="mt-6 inline-flex rounded-xl bg-sky-800 px-6 py-3 font-semibold text-white"
            >
              Explore Supersonic Fast Cash
            </Link>
          </div>
        </section>
        <section
          className="border-y border-slate-200 bg-slate-50 px-4 py-6"
          aria-labelledby="workone-home-cta"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="workone-home-cta" className="text-xl font-bold text-slate-950">
                Explore training funding
              </h2>
              <p className="mt-2 max-w-2xl text-base leading-6 text-slate-700">
                CDL, business and HVAC. Free to those who qualify; eligibility and
                program requirements apply.
              </p>
            </div>
            <a
              href={WORKONE_INDY_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-bold text-white hover:bg-slate-800"
            >
              Schedule WorkOne Appointment
            </a>
          </div>
        </section>
        <HomeFunding />
        <HomeEmployerStrip />
        <HomeInstitutionalGateway />
        <HomeWebsiteBuilderSales />
        <HomePlatformOverview />
        <div className="mx-auto max-w-6xl px-5">
          <ProgramGuideResources />
        </div>
        <section
          className="border-y border-slate-200 bg-white px-5 py-12 sm:py-16"
          aria-labelledby="workforce-platform-heading"
        >
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-800">
              The Elevate workforce platform
            </p>
            <h2
              id="workforce-platform-heading"
              className="mt-3 max-w-4xl text-3xl font-bold text-slate-950 sm:text-4xl"
            >
              Training, apprenticeships, employers, and workforce operations in one coordinated
              platform.
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-700">
              Elevate combines career training with workspaces for learners, host shops, program
              partners, employers, and staff. Explore a career pathway or see how the platform
              supports the people who deliver training.
            </p>
            <ul className="mt-8 grid list-disc gap-x-10 gap-y-5 pl-5 text-base leading-relaxed text-slate-700 md:grid-cols-2">
              <li>
                <strong className="text-slate-950">Learning and progress:</strong> courses, lessons,
                assessments, and learner records.
              </li>
              <li>
                <strong className="text-slate-950">Apprenticeship coordination:</strong> training
                hours, supervisor review, competencies, and host-shop records.
              </li>
              <li>
                <strong className="text-slate-950">Partner and employer workspaces:</strong> program
                coordination, participant records, and employer relationships.
              </li>
              <li>
                <strong className="text-slate-950">Workforce administration:</strong> documents,
                credentials, reporting, and evidence for authorized review.
              </li>
              <li>
                <strong className="text-slate-950">Operational tools:</strong> communications,
                meetings, and payroll records within supported workflows.
              </li>
              <li>
                <strong className="text-slate-950">Creation tools:</strong> explore website-building
                products and course-building workspaces.
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={ROUTES.programs}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-sky-800 px-6 py-3 font-semibold text-white hover:bg-sky-900"
              >
                Get Training
              </Link>
              <Link
                href={ROUTES.employers}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-slate-800"
              >
                Partner With Elevate
              </Link>
              <Link
                href="/platform"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-950 hover:bg-slate-50"
              >
                Explore the Platform
              </Link>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-slate-600">
              Workspace access depends on your assigned role and available services. Apprenticeship
              programs are self-pay; funding for other training depends on the specific program and
              applicant eligibility.
            </p>
          </div>
        </section>
        <HomeSocialAppCTA />
        <HomeFinalCTA />
      </main>
    </>
  );
}
