import { getHostShopNetwork } from '@/lib/programs/host-shop-network';
import HostShopPlacementGuideClient from './HostShopPlacementGuideClient';

export default async function HostShopPlacementGuide({ programSlug }: { programSlug: string }) {
  const network = await getHostShopNetwork();
  const shops = network.filter((shop) => shop.programs.includes(programSlug));
  return <HostShopPlacementGuideClient programSlug={programSlug} shops={shops} />;
}
