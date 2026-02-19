import { Metadata } from 'next';
import TradesProgramPage from '@/components/programs/TradesProgramPage';
import { ELECTRICAL_DATA } from '@/lib/trades-program-data';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Electrical Technology Training | Elevate for Humanity',
  description: 'Electrical Technology training — 16-24 weeks, 400+ hours. OSHA 10, NEC code, residential and commercial wiring. WIOA and Next Level Jobs eligible. Indianapolis.',
  alternates: { canonical: `${SITE_URL}/programs/electrical` },
  openGraph: {
    title: 'Electrical Technology Training | Elevate for Humanity',
    description: 'Electrical training — 16-24 weeks, OSHA 10 included. Path to licensed journeyman.',
    url: `${SITE_URL}/programs/electrical`,
    images: [{ url: `${SITE_URL}/images/trades/hero-program-electrical.jpg`, width: 1200, height: 630 }],
  },
};

export default function ElectricalPage() {
  return <TradesProgramPage data={ELECTRICAL_DATA} />;
}
