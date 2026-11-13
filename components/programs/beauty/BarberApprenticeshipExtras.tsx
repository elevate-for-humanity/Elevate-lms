import BeautyTheoryDailyPolicy from '@/components/programs/beauty/BeautyTheoryDailyPolicy';
import FeaturedHostPartners from '@/components/programs/beauty/FeaturedHostPartners';
import BarberWorkforceNetworkMap from '@/components/programs/beauty/BarberWorkforceNetworkMap';
import { getHostShopNetwork } from '@/lib/programs/host-shop-network';

/**
 * Barber-only supplements — host network and daily theory policy.
 * Kept separate from the main program narrative in ProgramDetailPage.
 */
export default async function BarberApprenticeshipExtras() {
  const shops = await getHostShopNetwork();
  return (
    <>
      <BeautyTheoryDailyPolicy programTitle="Barber Apprenticeship" />
      <FeaturedHostPartners programSlug="barber-apprenticeship" />
      <BarberWorkforceNetworkMap shops={shops} />
    </>
  );
}
