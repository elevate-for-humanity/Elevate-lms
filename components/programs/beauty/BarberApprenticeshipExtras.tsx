'use client';

import BeautyTheoryDailyPolicy from '@/components/programs/beauty/BeautyTheoryDailyPolicy';
import FeaturedHostPartners from '@/components/programs/beauty/FeaturedHostPartners';
import BarberWorkforceNetworkMap from '@/components/programs/beauty/BarberWorkforceNetworkMap';

/**
 * Barber-only supplements — host network and daily theory policy.
 * Kept separate from the main program narrative in ProgramDetailPage.
 */
export default function BarberApprenticeshipExtras() {
  return (
    <>
      <BeautyTheoryDailyPolicy programTitle="Barber Apprenticeship" />
      <FeaturedHostPartners />
      <BarberWorkforceNetworkMap />
    </>
  );
}
