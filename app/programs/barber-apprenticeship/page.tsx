
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import { BarberHero } from './sections/BarberHero';
import { BarberDeliveryModel } from './sections/BarberDeliveryModel';
import { BarberCredentials } from './sections/BarberCredentials';
import { BarberPartnership } from './sections/BarberPartnership';
import { BarberEnrollment } from './sections/BarberEnrollment';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Barber Apprenticeship | 2,000-Hour Licensed Training | Elevate',
  description: 'Barber apprenticeship in Indianapolis. 2,000 OJT hours in licensed barbershops with competency-based training, licensure pathway, and flexible payment options including BNPL.',
  alternates: { canonical: `${SITE_URL}/programs/barber-apprenticeship` },
  keywords: [
    'barber apprenticeship Indianapolis',
    'barber training Indiana',
    'licensed barber program',
    'barber OJT training',
    'earn while you learn barber',
    'barber license Indiana',
    'JRI barber program',
    'WIOA barber training',
    'barbershop apprenticeship',
    'barber school Indianapolis',
  ],
  openGraph: {
    title: 'Barber Apprenticeship | 2,000-Hour Licensed Training',
    description: '2,000-hour competency-based barber apprenticeship with licensed shop training and licensure pathway.',
    url: `${SITE_URL}/programs/barber-apprenticeship`,
    siteName: 'Elevate for Humanity',
    images: [{ url: `${SITE_URL}/images/programs-hq/barber-training.jpg`, width: 1200, height: 630, alt: 'Barber Apprenticeship Program' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Barber Apprenticeship | 2,000-Hour Licensed Training',
    description: '2,000-hour competency-based barber apprenticeship in Indianapolis.',
    images: [`${SITE_URL}/images/barber-hero-new.jpg`],
  },
};

export default function BarberApprenticeshipPage() {

  return (
    <>
      <ProgramStructuredData program={{
        id: 'barber-apprenticeship',
        name: 'Barber Apprenticeship Program',
        slug: 'barber-apprenticeship',
        description: '2,000-hour competency-based barber apprenticeship with licensed shop training, structured RTI, and licensure pathway alignment.',
        duration_weeks: 65,
        price: 4890,
        image_url: `${SITE_URL}/images/programs-hq/barber-training.jpg`,
        category: 'Beauty & Cosmetology',
        outcomes: ['Rise Up Certificate', 'Registered Barber License (Indiana)'],
      }} />
      <div className="min-h-screen bg-white">
        <div className="bg-slate-50 border-b">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <Breadcrumbs items={[
              { label: 'Programs', href: '/programs' },
              { label: 'Barber Apprenticeship' },
            ]} />
          </div>
        </div>

        <BarberHero />
        <BarberDeliveryModel />
        <BarberCredentials />
        <BarberPartnership />
        <BarberEnrollment />
      </div>
    </>
  );
}
