import type { Metadata } from 'next';
import HomeHeroVideo from '@/components/ui/HomeHeroVideo';
import heroBanners from '@/content/heroBanners';
import MarqueeBanner from '@/components/MarqueeBanner';
import { HomeTrustBar } from '@/components/home/HomeTrustBar';
import { HomeHowItWorks } from '@/components/home/HomeHowItWorks';
import { HomeCareerPathways } from '@/components/home/HomeCareerPathways';
import { HomeApprenticeshipInfra } from '@/components/home/HomeApprenticeshipInfra';
import { HomeFunding } from '@/components/home/HomeFunding';
import { HomeEmployerStrip } from '@/components/home/HomeEmployerStrip';
import { HomeFinalCTA } from '@/components/home/HomeFinalCTA';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { ParisFloatingButton } from '@/components/paris/ParisFloatingButton';

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: `${PLATFORM_DEFAULTS.orgName} | Workforce Training, Apprenticeships & Career Programs — Indianapolis` },
  description:
    'DOL-registered apprenticeship sponsor and Indiana ETPL-listed training provider. Career training programs in healthcare, skilled trades, CDL, technology, and beauty — funding options may be available.',
  keywords: [
    'workforce training Indianapolis',
    'Indiana workforce training',
    'DOL registered apprenticeship',
    'Indiana ETPL training provider',
    'career training Indiana',
    'apprenticeship programs Indianapolis',
    'HVAC training Indianapolis',
    'CNA training Indianapolis',
    'CDL training Indiana',
    'career training Marion County',
    PLATFORM_DEFAULTS.orgName,
  ],
  alternates: { canonical: PLATFORM_DEFAULTS.siteUrl },
  openGraph: {
    title: `${PLATFORM_DEFAULTS.orgName} | Workforce Training, Apprenticeships & Career Programs`,
    description:
      'DOL-registered apprenticeship sponsor and Indiana ETPL-listed training provider. Career programs in healthcare, skilled trades, CDL, technology, and beauty — funding options may be available.',
    url: PLATFORM_DEFAULTS.siteUrl,
    siteName: PLATFORM_DEFAULTS.orgName,
    images: [
      {
        url: '/images/pages/comp-home-hero.webp',
        width: 1200,
        height: 630,
        alt: `${PLATFORM_DEFAULTS.orgName} workforce training`,
      },
    ],
    type: 'website',
  },
};

export default function HomePage() {
  const banner = heroBanners.home;

  return (
    <>
      {/* 1. Immediate visual identity + primary action */}
      <HomeHeroVideo banner={banner} />

      {/* 2. Short current notices — not a second navigation bar */}
      <MarqueeBanner />

      {/* 3. Let visitors choose a visual career pathway */}
      <HomeCareerPathways />

      {/* 4. Explain the journey only after they can see the opportunities */}
      <HomeHowItWorks />

      {/* 5. Explain how training may be paid for */}
      <HomeFunding />

      {/* 6. Show the work-based learning infrastructure */}
      <HomeApprenticeshipInfra />

      {/* 7. Give employers a clear entry point */}
      <HomeEmployerStrip />

      {/* 8. Verification and trust, then one final action */}
      <HomeTrustBar />
      <HomeFinalCTA />

      <ParisFloatingButton />
    </>
  );
}
