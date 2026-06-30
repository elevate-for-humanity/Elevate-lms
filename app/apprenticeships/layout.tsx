import React from 'react';
import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Apprenticeship Programs | Earn While You Learn',
  description:
    'DOL-registered apprenticeship programs in barbering, cosmetology, culinary arts, and skilled trades. Earn while you learn with hands-on training and job placement.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apprenticeships',
  },
  openGraph: {
    title: 'Apprenticeship Programs - Earn While You Learn',
    description:
      'DOL-registered apprenticeships in barbering, cosmetology, culinary arts, and skilled trades. Hands-on training with job placement.',
    url: 'https://www.elevateforhumanity.org/apprenticeships',
    siteName: PLATFORM_DEFAULTS.orgName,
    images: [{ url: '/og-default.webp', width: 1200, height: 630, alt: 'Apprenticeship Programs' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apprenticeship Programs - Earn While You Learn',
    description: 'Paid apprenticeships with hands-on training and job placement.',
    images: ['/og-default.webp'],
  },
};

export default function ApprenticeshipsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
