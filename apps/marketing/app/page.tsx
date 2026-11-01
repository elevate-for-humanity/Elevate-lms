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
import { HomeEmployerStrip } from '@/components/home/HomeEmployerStrip';
import { HomeWebsiteBuilderSales } from '@/components/home/HomeWebsiteBuilderSales';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import StructuredData from '@/components/StructuredData';

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
        <HvacTrainingShowcase compact />
        <HomeCareerPathways />
        <HomeFeaturedHostShop />
        <HomeHowItWorks />
        <HomeEmployerStrip />
        <section
          className="border-y border-slate-200 bg-slate-50 px-5 py-8"
          aria-labelledby="tax-home-cta"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-sky-800">Supersonic Fast Cash</p>
              <h2 id="tax-home-cta" className="mt-2 text-2xl font-bold text-slate-950">
                Tax preparation classes and in-office filing
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-700">
                Learn how to start your own tax preparation business through our business class, or
                get help filing your tax return in our office.
              </p>
            </div>
            <Link
              href="/tax"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-sky-800 px-5 py-3 font-semibold text-white hover:bg-sky-900"
            >
              Explore tax classes &amp; services
            </Link>
          </div>
        </section>
        <HomeWebsiteBuilderSales />
        <div className="mx-auto max-w-6xl px-5">
          <ProgramGuideResources />
        </div>
        <HomeSocialAppCTA />
        <HomeFinalCTA />
      </main>
    </>
  );
}
