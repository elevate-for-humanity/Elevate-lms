import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Funding Options | Career Training Financial Assistance',
  description:
    'Explore funding options for career training including WIOA, Job Ready Indy, and state programs. Many programs can be FREE if you qualify.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/funding',
  },
  openGraph: {
    title: 'Funding Options for Career Training',
    description:
      'WIOA, Job Ready Indy, and state funding programs. Many programs can be FREE if you qualify.',
    url: 'https://www.elevateforhumanity.org/funding',
    siteName: PLATFORM_DEFAULTS.orgName,
    images: [{ url: '/og-default.webp', width: 1200, height: 630, alt: 'Career Training Funding' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Funding Options for Career Training',
    description: 'WIOA, Job Ready Indy, and state funding programs. Many programs can be FREE if you qualify.',
    images: ['/og-default.webp'],
  },
};

export default function FundingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
