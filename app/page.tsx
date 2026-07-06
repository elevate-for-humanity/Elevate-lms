import type { Metadata } from 'next';
import ElevateAnimatedHome from '@/components/home/ElevateAnimatedHome';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// Revalidate every 5 minutes — allows live enrollment stats to refresh
// without a full rebuild.
export const revalidate = 300;

export const metadata: Metadata = {
  title: `${PLATFORM_DEFAULTS.orgName} | Workforce Training, Apprenticeships & Funding — Indianapolis`,
  description:
    'DOL-registered apprenticeship sponsor and WIOA-approved training provider. Funded training in healthcare, skilled trades, CDL, technology, and more — often at no cost. Apply today.',
  keywords: [
    'workforce training Indianapolis',
    'WIOA training Indiana',
    'DOL registered apprenticeship',
    'ETPL approved training provider',
    'funded career training Indiana',
    'apprenticeship programs Indianapolis',
    'HVAC training Indianapolis',
    'CNA training Indianapolis',
    'CDL training Indiana',
    'free job training Marion County',
    PLATFORM_DEFAULTS.orgName,
  ],
  alternates: {
    canonical: PLATFORM_DEFAULTS.siteUrl,
  },
  openGraph: {
    title: `${PLATFORM_DEFAULTS.orgName} | Workforce Training, Apprenticeships & Funding`,
    description:
      'DOL-registered apprenticeship sponsor. Funded training in healthcare, skilled trades, CDL, and technology — often at no cost through WIOA or state funding.',
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
  twitter: {
    card: 'summary_large_image',
    title: `${PLATFORM_DEFAULTS.orgName} | Workforce Training & Apprenticeships`,
    description:
      'Funded training, DOL-registered apprenticeships, and job placement — often at no cost.',
    images: ['/images/pages/comp-home-hero.webp'],
  },
};

export default function HomePage() {
  return <ElevateAnimatedHome />;
}

