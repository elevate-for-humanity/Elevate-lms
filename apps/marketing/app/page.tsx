// Homepage sections are intentionally ordered from visual proof to pathways to action.
// Funding/payment sales content belongs on funding and program pages, not the homepage.
import type { Metadata } from 'next';
import { HomeTrustBar } from '@/components/home/HomeTrustBar';
import { HomeCareerPathways } from '@/components/home/HomeCareerPathways';
import { HomeFinalCTA } from '@/components/home/HomeFinalCTA';
import { PlatformHubHero } from '@/components/home/PlatformHubHero';
import { HomeFeaturedHostShop } from '@/components/home/HomeFeaturedHostShop';
import { HomePlatformOverview } from '@/components/home/HomePlatformOverview';
import { HomeNetworks } from '@/components/home/HomeNetworks';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import StructuredData from '@/components/StructuredData';
import { WORKONE_INDY_BOOKING_URL } from '@/lib/workone/booking';

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
        <a
          href={WORKONE_INDY_BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-yellow-300 px-4 py-4 text-center text-lg font-black uppercase tracking-wide text-slate-950 sm:text-xl"
        >
          POSSIBLE FUNDING FOR CDL, BOOKKEEPING, BUSINESS & HVAC TRAINING — SIGN UP FOR YOUR WORKONE APPOINTMENT HERE FOR YOUR INTAKE TO SEE IF YOU QUALIFY
        </a>
        <PlatformHubHero />
        <HomeFeaturedHostShop />
        <HomeNetworks />
        <HomeCareerPathways />
        <HomePlatformOverview />
        <HomeFinalCTA />
        <HomeTrustBar />
      </main>
    </>
  );
}
