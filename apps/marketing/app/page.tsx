// Homepage sections are intentionally ordered from visual proof to pathways to action.
// Funding/payment sales content belongs on funding and program pages, not the homepage.
import type { Metadata } from 'next';
import { HomeTrustBar } from '@/components/home/HomeTrustBar';
import { HomeCareerPathways } from '@/components/home/HomeCareerPathways';
import { HomeFinalCTA } from '@/components/home/HomeFinalCTA';
import { PlatformHubHero } from '@/components/home/PlatformHubHero';
import { HomeFeaturedHostShop } from '@/components/home/HomeFeaturedHostShop';
import { HomePlatformOverview } from '@/components/home/HomePlatformOverview';
import { HomeWebsiteBuilderSales } from '@/components/home/HomeWebsiteBuilderSales';
import { HomeSocialAppCTA } from '@/components/home/HomeSocialAppCTA';
import { HomeEmployerStrip } from '@/components/home/HomeEmployerStrip';
import { HomeNetworks } from '@/components/home/HomeNetworks';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import StructuredData from '@/components/StructuredData';

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: `${PLATFORM_DEFAULTS.orgName} | Workforce Training & Apprenticeship Platform` },
  description: 'Career training, registered apprenticeships, employer coordination, credentials, compliance, and participant progress.',
  alternates: { canonical: 'https://www.elevateforhumanity.org' },
  openGraph: {
    title: `${PLATFORM_DEFAULTS.orgName} | Career Training & Apprenticeships`,
    description: 'Career training, registered apprenticeships, testing, credentials, employer connections, and workforce technology.',
    url: 'https://www.elevateforhumanity.org',
    siteName: PLATFORM_DEFAULTS.orgName,
    locale: 'en_US',
    images: [{ url: '/images/pages/comp-home-hero.webp', width: 1200, height: 630, alt: `${PLATFORM_DEFAULTS.orgName} career training and workforce programs` }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PLATFORM_DEFAULTS.orgName} | Career Training & Apprenticeships`,
    description: 'Explore career training, registered apprenticeships, Host Shops, and employer-connected pathways across Indiana.',
    images: ['/images/pages/comp-home-hero.webp'],
  },
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <main className="[&_a]:no-underline [&_a:hover]:no-underline">
        <PlatformHubHero />
        <HomeFeaturedHostShop />
        <HomeNetworks />
        <HomeCareerPathways />
        <HomeEmployerStrip />
        <HomeWebsiteBuilderSales />
        <HomeSocialAppCTA />
        <HomePlatformOverview />
        <HomeFinalCTA />
        <HomeTrustBar />
      </main>
    </>
  );
}
