import { Metadata } from 'next';
import TradesProgramPage from '@/components/programs/TradesProgramPage';
import { HVAC_DATA } from '@/lib/trades-program-data';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'HVAC Technician Training | Elevate for Humanity',
  description: 'HVAC Technician training — 20 weeks, 400+ hours. EPA 608 certification, OSHA 30, hands-on internship. WIOA and Next Level Jobs eligible. Indianapolis.',
  alternates: { canonical: `${SITE_URL}/programs/hvac-technician` },
  openGraph: {
    title: 'HVAC Technician Training | Elevate for Humanity',
    description: 'HVAC training — 20 weeks, EPA 608 certification included. WIOA funded.',
    url: `${SITE_URL}/programs/hvac-technician`,
    images: [{ url: `${SITE_URL}/images/trades/hero-program-hvac.jpg`, width: 1200, height: 630 }],
  },
};

export default function HVACTechnicianPage() {
  return <TradesProgramPage data={HVAC_DATA} />;
}
