export const revalidate = 3600;

import { Metadata } from 'next';
import { PremiumTestingCenter } from '@/components/testing/PremiumTestingCenter';

export const metadata: Metadata = {
  title: 'Testing & Credential Exams',
  description:
    'Workforce credential exams and proctor-supervised certification testing. Certiport, EPA 608, ACT WorkKeys/NCRC, NHA, and NRF Rise Up exams available through authorized testing partnerships.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/testing',
  },
};

export default function TestingPage() {
  return <PremiumTestingCenter />;
}
