import type { Metadata } from 'next';
import PremiumTestingCenter from '@/components/testing/TestingCenter';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Testing Center | Elevate For Humanity',
  description:
    'Schedule certification exams at Elevate\'s Indiana testing center. ACT WorkKeys NCRC, Certiport MOS, EPA 608, OSHA, CPR, NHA, and more. In-person proctoring, online scheduling, and credentials.',
  keywords: [
    'certification exams',
    'testing center Indianapolis',
    'ACT WorkKeys',
    'Certiport',
    'EPA 608',
    'OSHA certification',
    'CPR certification',
    'NHA exams',
    'career certification',
    'Indiana testing center',
  ],
  openGraph: {
    title: 'Testing Center | Elevate For Humanity',
    description:
      'Schedule certification exams in healthcare, trades, IT, and business. ACT WorkKeys, Certiport, EPA 608, OSHA, CPR, NHA proctoring.',
    type: 'website',
  },
};

export default function TestingCenterPage() {
  return <PremiumTestingCenter />;
}
