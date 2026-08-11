import type { Metadata } from 'next';
import HomeHeroVideo from '@/components/ui/HomeHeroVideo';
import heroBanners from '@/content/heroBanners';
import MarqueeBanner from '@/components/MarqueeBanner';
import { HomeTrustBar } from '@/components/home/HomeTrustBar';
import { HomeHowItWorks } from '@/components/home/HomeHowItWorks';
import { HomeCareerPathways } from '@/components/home/HomeCareerPathways';
import { HomeBeautyPriority } from '@/components/home/HomeBeautyPriority';
import { HomeApprenticeshipInfra } from '@/components/home/HomeApprenticeshipInfra';
import { HomeFunding } from '@/components/home/HomeFunding';
import { HomeEmployerStrip } from '@/components/home/HomeEmployerStrip';
import { HomeFinalCTA } from '@/components/home/HomeFinalCTA';
import { HomeFoundationPartner } from '@/components/home/HomeFoundationPartner';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { ParisFloatingButton } from '@/components/paris/ParisFloatingButton';
import StructuredData from '@/components/StructuredData';

export const revalidate = 300;

export const metadata: Metadata = {
  title: {
    absolute: `${PLATFORM_DEFAULTS.orgName} | Workforce Training, Apprenticeships & Career Programs — Indianapolis`,
  },
  description:
    'DOL-registered apprenticeship sponsor and Indiana ETPL-listed training provider. Career training programs in healthcare, skilled trades, CDL, technology, and beauty — funding options may be available.',
  keywords: [
    'workforce training Indianapolis',
    'Indiana workforce training',
    'DOL registered apprenticeship',
    'Indiana ETPL training provider',
    'career training Indiana',
    'apprenticeship programs Indianapolis',
    'Indiana barber apprenticeship',
    'Indiana cosmetology apprenticeship',
    'Indiana nail technician apprenticeship',
    'earn while you learn beauty apprenticeship',
    'HVAC training Indianapolis',
    'CNA training Indianapolis',
    'CDL training Indiana',
    'career training Marion County',
    PLATFORM_DEFAULTS.orgName,
  ],
  alternates: { canonical: 'https://www.elevateforhumanity.org' },
  openGraph: {
    title: `${PLATFORM_DEFAULTS.orgName} | Workforce Training, Apprenticeships & Career Programs`,
    description:
      'Registered apprenticeships and career programs across healthcare, skilled trades, beauty, CDL, technology, and business. Funding eligibility varies by program and participant.',
    url: 'https://www.elevateforhumanity.org',
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
      <StructuredData />
      <HomeHeroVideo banner={banner} />
      <HomeBeautyPriority />
      <MarqueeBanner />
      <HomeFoundationPartner />
      <HomeCareerPathways />
      <HomeHowItWorks />
      <HomeFunding />
      <HomeApprenticeshipInfra />
      <HomeEmployerStrip />
      <HomeTrustBar />
      <HomeFinalCTA />
      <ParisFloatingButton />
    </>
  );
}
