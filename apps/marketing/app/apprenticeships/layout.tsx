import React from 'react';
import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Registered Apprenticeship Programs in Indiana | Elevate for Humanity',
  description:
    'Explore Indiana apprenticeship pathways in barbering, cosmetology, esthetics, and nail technology with supervised host-site training, related instruction, progress tracking, and licensing preparation.',
  keywords: [
    'registered apprenticeship Indiana',
    'apprenticeship programs Indianapolis',
    'barber apprenticeship Indiana',
    'cosmetology apprenticeship Indiana',
    'esthetician apprenticeship Indiana',
    'nail technician apprenticeship Indiana',
    'beauty apprenticeship Indiana',
    'earn while you learn Indiana',
  ],
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apprenticeships',
  },
  openGraph: {
    title: 'Registered Apprenticeship Programs in Indiana',
    description:
      'Compare barber, cosmetology, esthetician, and nail technician apprenticeship pathways with supervised host-site training and related instruction.',
    url: 'https://www.elevateforhumanity.org/apprenticeships',
    siteName: PLATFORM_DEFAULTS.orgName,
    images: [{
      url: '/og-default.webp',
      width: 1200,
      height: 630,
      alt: 'Indiana registered apprenticeship programs at Elevate for Humanity',
    }],
    type: 'website',
  },
};

export default function ApprenticeshipsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
