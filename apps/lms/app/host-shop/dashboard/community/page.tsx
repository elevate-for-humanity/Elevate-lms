import SocialLearningCommunity from '@/components/SocialLearningCommunity';
import { BusinessNetworkCard } from '@/components/portal/BusinessNetworkCard';
import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Barber & Beauty Network', robots: { index: false, follow: false } };
export default async function Page() {
  const { user, partner } = await requireCurrentHostShopPartner();
  return <main className="mx-auto max-w-7xl px-4 py-6"><BusinessNetworkCard href="#network-feed" label="Barber & Beauty Network" /><div id="network-feed"><SocialLearningCommunity userId={user.id} userName={partner.name || 'Host Shop'} /></div></main>;
}
