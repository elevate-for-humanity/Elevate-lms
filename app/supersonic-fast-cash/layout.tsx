import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Supersonic Fast Cash | Tax Preparation & Refund Services',
  description: 'Fast tax preparation and refund services. Get your maximum refund with professional tax preparers.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash',
  },
  openGraph: {
    title: 'Supersonic Fast Cash - Tax Preparation',
    description: 'Fast tax preparation and refund services. Get your maximum refund.',
    url: 'https://www.elevateforhumanity.org/supersonic-fast-cash',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Supersonic Fast Cash' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Supersonic Fast Cash - Tax Preparation',
    description: 'Fast tax preparation and refund services.',
    images: ['/og-default.jpg'],
  },
};

export default function SupersonicFastCashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
