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
import { HomeFoundationPartner } from '@/components/home/HomeFoundationPartner';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { ParisFloatingButton } from '@/components/paris/ParisFloatingButton';
import StructuredData from '@/components/StructuredData';

export const revalidate = 300;

export const metadata: Metadata = {
  title: {
    absolute: `${PLATFORM_DEFAULTS.orgName} | AI-Powered 360° Humanitarian Workforce Hub`,
  },
  description:
    'AI-powered humanitarian workforce hub connecting career training, an integrated LMS, hands-on learning, testing, credentials, registered apprenticeships, workforce funding, employment, employers, supportive services, and public-sector partners.',
  keywords: [
    'humanitarian workforce hub',
    'AI workforce platform',
    'learning management system',
    'workforce training Indianapolis',
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
    title: `${PLATFORM_DEFAULTS.orgName} | AI-Powered 360° Humanitarian Workforce Hub`,
    description:
      'Training, LMS learning, hands-on experience, testing, apprenticeships, credentials, workforce funding, employment, employers, supportive services, and advancement in one connected ecosystem.',
    url: 'https://www.elevateforhumanity.org',
    siteName: PLATFORM_DEFAULTS.orgName,
    images: [
      {
        url: '/images/pages/comp-home-hero.webp',
        width: 1200,
        height: 630,
        alt: `${PLATFORM_DEFAULTS.orgName} workforce and humanitarian hub`,
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
      <HomeCareerPathways />
      <HomeTrustBar />
      <HomeHowItWorks />
      <HomeFoundationPartner />
      <HomeFunding />
      <HomeApprenticeshipInfra />
      <HomeEmployerStrip />
      <HomeFinalCTA />
      <ParisFloatingButton />
    </>
  );
}
