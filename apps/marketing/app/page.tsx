import HvacTrainingShowcase from '@/components/programs/HvacTrainingShowcase';
// Keep the homepage focused on training, the featured shops, and enrollment.
// Detailed platform operations remain on the dedicated platform pages.
import type { Metadata } from 'next';
import { HomeHowItWorks } from '@/components/home/HomeHowItWorks';
import { HomeCareerPathways } from '@/components/home/HomeCareerPathways';
import { HomeSocialAppCTA } from '@/components/home/HomeSocialAppCTA';
import { HomeFinalCTA } from '@/components/home/HomeFinalCTA';
import { PlatformHubHero } from '@/components/home/PlatformHubHero';
import { HomeFeaturedHostShop } from '@/components/home/HomeFeaturedHostShop';
import { HomeEmployerStrip } from '@/components/home/HomeEmployerStrip';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import StructuredData from '@/components/StructuredData';

// Marketing content can be regenerated hourly; enrollment and account APIs remain dynamic.
export const revalidate = 3600;

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
        <HomeSocialAppCTA />
        <HomeFinalCTA />
      </main>
    </>
  );
}
