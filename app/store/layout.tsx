import { Metadata } from 'next';
import StoreClientWrapper from './StoreClientWrapper';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Store — License the Elevate Workforce Platform',
  description: 'Deploy a proven eligibility-to-placement workforce system. Self-serve plans from $99/month or enterprise licenses from $35,000. Built for workforce boards, training providers, and public-private partnerships.',
  keywords: [
    'workforce platform license',
    'LMS licensing',
    'workforce development software',
    'training provider platform',
    'workforce board software',
    'apprenticeship management system',
    'WIOA compliant software',
  ],
  openGraph: {
    title: 'License the Elevate Workforce Platform',
    description: 'Deploy a proven eligibility-to-placement workforce system. Start with a 14-day free trial.',
    url: 'https://www.elevateforhumanity.org/store',
    siteName: PLATFORM_DEFAULTS.orgName,
    type: 'website',
    images: [
      {
        url: 'https://www.elevateforhumanity.org/og-store.png',
        width: 1200,
        height: 630,
        alt: 'Elevate Workforce Platform - Licensing Options',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'License the Elevate Workforce Platform',
    description: 'Deploy a proven eligibility-to-placement workforce system. Self-serve from $99/mo.',
  },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreClientWrapper>
      {children}
    </StoreClientWrapper>
  );
}
