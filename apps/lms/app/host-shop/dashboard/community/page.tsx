import SocialLearningCommunity from '@/components/SocialLearningCommunity';
import { BarberBeautyNetworkGuide } from '@/components/partners/BarberBeautyNetworkGuide';
import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Barber & Beauty Network',
  robots: { index: false, follow: false },
};
export default async function Page() {
  const { user, partner, isPlatformAdmin } = await requireCurrentHostShopPartner();
  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <BarberBeautyNetworkGuide />
      <div id="network-feed">
        <SocialLearningCommunity
          userId={user.id}
          userName={isPlatformAdmin ? 'Administrator preview' : partner.name || 'Host Shop'}
          readOnly={isPlatformAdmin}
        />
      </div>
    </main>
  );
}
