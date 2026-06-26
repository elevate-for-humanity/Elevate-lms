import { Metadata } from 'next';
import ApprenticeshipHub from '@/components/beauty/ApprenticeshipHub';

export const metadata: Metadata = {
  title: 'Barber & Beauty Apprenticeship Programs | DOL Registered | Earn While You Learn | Nationwide',
  description: 'Start your barber or beauty career with our DOL-registered apprenticeships. Programs include Barber, Cosmetology, Esthetician, and Nail Technician. 2,000 hours. Funding available nationwide.',
  keywords: [
    'barber apprenticeship',
    'beauty apprenticeship',
    'cosmetology apprenticeship',
    'esthetician apprenticeship',
    'nail technician apprenticeship',
    'DOL registered apprenticeship',
    'beauty school alternative',
    'earn while you learn',
    'barber license',
    'cosmetology license',
    'apprenticeship programs',
    'beauty careers',
    'barber careers',
    'nationwide apprenticeship',
    'host shop partner'
  ],
  authors: [{ name: 'Elevate for Humanity Career & Technical Institute' }],
  openGraph: {
    title: 'Beauty Apprenticeships | DOL Registered | Earn While You Learn',
    description: 'Start your beauty career with DOL-registered apprenticeships. 2,000 hours of training, Indiana licensure, $4,980 total.',
    url: 'https://www.elevateforhumanity.org/beauty-apprenticeships',
    siteName: 'Elevate for Humanity',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Beauty Apprenticeships | DOL Registered',
    description: 'Start your beauty career. 2,000 hours, $4,980. Funding available.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/beauty-apprenticeships',
  },
};

export default function BarberAndBeautyApprenticeshipsPage() {
  return <ApprenticeshipHub />;
}
