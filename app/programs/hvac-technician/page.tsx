import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import { HvacHero } from './sections/HvacHero';
import { HvacDeliveryModel } from './sections/HvacDeliveryModel';
import { HvacCredentials } from './sections/HvacCredentials';
import { HvacEnrollment } from './sections/HvacEnrollment';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'HVAC Technician Training | 20-Week Program | Workforce Ready Grant | Elevate',
  description: 'HVAC technician training in Indianapolis. 20-week program with 6 credentials including EPA 608, Residential HVAC Certification 1 & 2, OSHA 30, CPR, and Rise Up. Workforce Ready Grant eligible.',
  alternates: { canonical: `${SITE_URL}/programs/hvac-technician` },
  keywords: [
    'HVAC training Indianapolis',
    'HVAC technician certification',
    'Workforce Ready Grant HVAC',
    'HVAC school Indiana',
    'heating and cooling training',
    'OSHA 30 HVAC',
    'Residential HVAC Certification',
    'WIOA HVAC program',
    'free HVAC training Indiana',
    'Next Level Jobs HVAC',
    'HVAC apprenticeship Indiana',
    'refrigeration technician training',
  ],
  openGraph: {
    title: 'HVAC Technician Training | 20-Week Program | Workforce Ready Grant',
    description: '20-week HVAC program with 6 credentials including EPA 608. Workforce Ready Grant eligible through Next Level Jobs.',
    url: `${SITE_URL}/programs/hvac-technician`,
    siteName: 'Elevate for Humanity',
    images: [{ url: `${SITE_URL}/images/trades/program-hvac-overview.jpg`, width: 1200, height: 630, alt: 'HVAC Technician Training Program' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HVAC Technician Training | Workforce Ready Grant Eligible',
    description: '20-week HVAC program with 6 credentials including EPA 608 in Indianapolis.',
    images: [`${SITE_URL}/images/trades/hero-program-hvac.jpg`],
  },
};

export default function HVACTechnicianPage() {
  return (
    <>
      <ProgramStructuredData program={{
        id: 'hvac-technician',
        name: 'HVAC Technician Training',
        slug: 'hvac-technician',
        description: '20-week competency-based HVAC training with 6 industry credentials including EPA 608 Universal, Residential HVAC Certification 1 & 2, OSHA 30, CPR, and Rise Up. Workforce Ready Grant eligible.',
        duration_weeks: 20,
        price: 5000,
        image_url: `${SITE_URL}/images/programs-hq/hvac-technician.jpg`,
        category: 'Skilled Trades',
        outcomes: ['Residential HVAC Certification 1', 'Residential HVAC Certification 2 - Refrigeration Diagnostics', 'EPA 608 Universal Certification', 'OSHA 30', 'CPR', 'Rise Up Certificate'],
      }} />
      <div className="min-h-screen bg-white">
        <div className="bg-slate-50 border-b">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <Breadcrumbs items={[
              { label: 'Programs', href: '/programs' },
              { label: 'Skilled Trades', href: '/programs/skilled-trades' },
              { label: 'HVAC Technician' },
            ]} />
          </div>
        </div>

        <HvacHero />
        <HvacDeliveryModel />
        <HvacCredentials />
        <HvacEnrollment />
      </div>
    </>
  );
}
