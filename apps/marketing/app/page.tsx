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
        <div data-scroll-narration data-narration-src="/audio/narration/host-shop.mp3" data-narration="Meet featured Host Shops where apprentices build real skills under qualified supervision.">
          <HomeFeaturedHostShop />
        </div>
        <div data-scroll-narration data-narration="Join Elevate's professional networks and explore apprenticeship and employer connections.">
          <HomeNetworks />
        </div>
        <div data-scroll-narration data-narration-src="/audio/narration/career-pathways.mp3" data-narration="Explore career pathways and registered apprenticeship programs. Open a program page for its current eligibility, tuition, duration, and enrollment details.">
          <HomeCareerPathways />
        </div>
        <div data-scroll-narration data-narration="Employers can hire credentialed graduates, become an apprenticeship Host Site, or work with Elevate to design a training cohort.">
          <HomeEmployerStrip />
        </div>
        <div data-scroll-narration data-narration-src="/audio/narration/website-builder.mp3" data-narration="Use Elevate's no-code Website Builder to create and revise business website pages with voice or text.">
          <HomeWebsiteBuilderSales />
        </div>
        <div data-scroll-narration data-narration="Follow Elevate's official channels and install the app for convenient access.">
          <HomeSocialAppCTA />
        </div>
        <div data-scroll-narration data-narration="Elevate connects applications, courses, apprenticeships, attendance, credentials, employer workflows, and workforce operations in one coordinated platform.">
          <HomePlatformOverview />
        </div>
        <div data-scroll-narration data-narration-src="/audio/narration/final.mp3" data-narration="Ready for your next step? Start an application or contact our team for help choosing the right path.">
          <HomeFinalCTA />
        </div>
        <div data-narration-disabled="true"><HomeTrustBar /></div>
      </main>
    </>
  );
}
