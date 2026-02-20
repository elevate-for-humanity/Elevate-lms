
import { Metadata } from 'next';
import TradesProgramPage from '@/components/programs/TradesProgramPage';
import { FORKLIFT_DATA } from '@/lib/trades-program-data';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Forklift Operator Certification | Elevate for Humanity',
  description: 'OSHA-compliant forklift operator certification in 1 day. Classroom instruction + hands-on driving evaluation. PPE and exam included. Indianapolis.',
  alternates: { canonical: `${SITE_URL}/programs/forklift` },
  openGraph: {
    title: 'Forklift Operator Certification | Elevate for Humanity',
    description: 'Forklift certification — 1 day, OSHA compliant. Exam and PPE included.',
    url: `${SITE_URL}/programs/forklift`,
    images: [{ url: `${SITE_URL}/images/trades/hero-program-carpentry.jpg`, width: 1200, height: 630 }],
  },
};

export default function ForkliftPage() {

  return <TradesProgramPage data={FORKLIFT_DATA} />;
}
