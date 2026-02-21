import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import HVACProgramContent from '@/app/programs/hvac/HVACProgramContent';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'HVAC Technician Training | 12-Week Program | Elevate for Humanity',
  description: 'HVAC technician training in Indianapolis. 12-week program with EPA 608, OSHA 30, and program certificate. Funding available through WIOA for qualifying adults.',
  alternates: { canonical: `${SITE_URL}/programs/hvac-technician` },
  keywords: [
    'HVAC training Indianapolis',
    'HVAC technician certification',
    'Workforce Ready Grant HVAC',
    'HVAC school Indiana',
    'heating and cooling training',
    'OSHA 30 HVAC',
    'EPA 608 certification',
    'WIOA HVAC program',
    'free HVAC training Indiana',
    'HVAC apprenticeship Indiana',
  ],
  openGraph: {
    title: 'HVAC Technician Training | Elevate for Humanity',
    description: '12-week HVAC program with EPA 608 and OSHA 30 certifications. Funding available for qualifying adults.',
    url: `${SITE_URL}/programs/hvac-technician`,
    siteName: 'Elevate for Humanity',
    images: [{ url: `${SITE_URL}/images/trades/hero-program-hvac.jpg`, width: 1200, height: 630, alt: 'HVAC Technician Training Program' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HVAC Technician Training | Elevate for Humanity',
    description: '12-week HVAC program with EPA 608 and OSHA 30 in Indianapolis.',
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
        description: '12-week HVAC fundamentals program with EPA 608, OSHA 30, employer site days, and apprenticeship readiness. Funding available through WIOA.',
        duration_weeks: 12,
        price: 0,
        image_url: `${SITE_URL}/images/trades/hero-program-hvac.jpg`,
        category: 'Skilled Trades',
        outcomes: ['EPA 608 Universal Certification', 'OSHA 30 Safety Certification', 'Program Completion Certificate'],
      }} />
      <HVACProgramContent />
    </>
  );
}
