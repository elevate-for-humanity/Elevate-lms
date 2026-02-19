import { Metadata } from 'next';
import TradesProgramPage from '@/components/programs/TradesProgramPage';
import { PLUMBING_DATA } from '@/lib/trades-program-data';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Plumbing Technology Training | Elevate for Humanity',
  description: 'Plumbing Technology training — 16 weeks, 400+ hours. OSHA 10, water supply, DWV, gas piping. WIOA and Next Level Jobs eligible. Indianapolis.',
  alternates: { canonical: `${SITE_URL}/programs/plumbing` },
  openGraph: {
    title: 'Plumbing Technology Training | Elevate for Humanity',
    description: 'Plumbing training — 16 weeks, OSHA 10 included. Recession-proof trade career.',
    url: `${SITE_URL}/programs/plumbing`,
    images: [{ url: `${SITE_URL}/images/trades/hero-program-plumbing.jpg`, width: 1200, height: 630 }],
  },
};

export default function PlumbingPage() {
  return <TradesProgramPage data={PLUMBING_DATA} />;
}
