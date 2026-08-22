import type { Metadata } from 'next';
import HomeHeroVideo from '@/components/ui/HomeHeroVideo';
import heroBanners from '@/content/heroBanners';
import MarqueeBanner from '@/components/MarqueeBanner';
import { HomePlatformOverview } from '@/components/home/HomePlatformOverview';
import { HomeTrustBar } from '@/components/home/HomeTrustBar';
import { HomeHowItWorks } from '@/components/home/HomeHowItWorks';
import { HomeCareerPathways } from '@/components/home/HomeCareerPathways';
import { HomeBeautyPriority } from '@/components/home/HomeBeautyPriority';
import { HomeApprenticeshipInfra } from '@/components/home/HomeApprenticeshipInfra';
import { HomeFunding } from '@/components/home/HomeFunding';
import { FundingQuickCheck } from '@/components/home/FundingQuickCheck';
import { HomeEmployerStrip } from '@/components/home/HomeEmployerStrip';
import { HomeFinalCTA } from '@/components/home/HomeFinalCTA';
import { HomeFoundationPartner } from '@/components/home/HomeFoundationPartner';
import { HomeMobileActions } from '@/components/home/HomeMobileActions';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { ParisFloatingButton } from '@/components/paris/ParisFloatingButton';
import StructuredData from '@/components/StructuredData';

export const revalidate = 300;

export const metadata: Metadata = {
  title: {
    absolute: `${PLATFORM_DEFAULTS.orgName} | Career Training & Apprenticeships in Indianapolis`,
  },
  description:
    'Explore career training, registered apprenticeships, workforce funding pathways, testing, credentials, and employer-connected programs in Indianapolis and across Indiana. Funding eligibility is determined by the responsible agency.',
  keywords: [
    'career training Indianapolis',
    'job training Indianapolis',
    'workforce development Indiana',
    'registered apprenticeships Indiana',
    'Indiana workforce training',
    'DOL registered apprenticeship sponsor',
    'Indiana ETPL training provider',
    'career testing and proctoring',
    'workforce funding Indiana',
    'hands-on career training',
    'career credentials',
    'employer workforce development',
    PLATFORM_DEFAULTS.orgName,
  ],
  alternates: { canonical: 'https://www.elevateforhumanity.org' },
  openGraph: {
    title: `${PLATFORM_DEFAULTS.orgName} | Career Training & Apprenticeships`,
    description:
      'Career training, registered apprenticeships, funding navigation, testing, credentials, employer connections, and workforce technology in one connected platform.',
    url: 'https://www.elevateforhumanity.org',
    siteName: PLATFORM_DEFAULTS.orgName,
    images: [
      {
        url: '/images/pages/comp-home-hero.webp',
        width: 1200,
        height: 630,
        alt: `${PLATFORM_DEFAULTS.orgName} career training and workforce programs`,
      },
    ],
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <HomeHeroVideo banner={heroBanners.home} />
      <MarqueeBanner />
      <HomeTrustBar />
      <FundingQuickCheck />
      <HomeCareerPathways />
      <HomeBeautyPriority />
      <HomeHowItWorks />
      <HomeApprenticeshipInfra />
      <HomeFunding />
      <HomeEmployerStrip />
      <HomePlatformOverview />
      <HomeFoundationPartner />
      <HomeFinalCTA />
      <ParisFloatingButton />
      <HomeMobileActions />
    </>
  );
}
