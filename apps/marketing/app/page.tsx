import type { Metadata } from 'next';
import { HomeHumanitarianHubV2 } from '@/components/home/HomeHumanitarianHubV2';
import { ParisFloatingButton } from '@/components/paris/ParisFloatingButton';
import StructuredData from '@/components/StructuredData';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 300;

export const metadata: Metadata = {
  title: {
    absolute: `${PLATFORM_DEFAULTS.orgName} | AI-Powered 360° Humanitarian Workforce Hub`,
  },
  description:
    'AI-powered humanitarian workforce hub connecting training, LMS learning, hands-on experience, testing, credentials, registered apprenticeships, workforce funding, employment, employers, supportive services, and public-sector partners.',
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
      'One connected ecosystem for learning, training, testing, apprenticeships, credentials, workforce funding, employment, employers, supportive services, and advancement.',
    url: 'https://www.elevateforhumanity.org',
    siteName: PLATFORM_DEFAULTS.orgName,
    images: [
      {
        url: '/images/heroes/hero-homepage.webp',
        width: 1200,
        height: 630,
        alt: `${PLATFORM_DEFAULTS.orgName} humanitarian workforce hub`,
      },
    ],
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <HomeHumanitarianHubV2 />
      <ParisFloatingButton />
    </>
  );
}
