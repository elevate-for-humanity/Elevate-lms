import { matchesHostShopProgram } from '@/lib/programs/host-shop-programs';
import { getHostShopNetwork } from '@/lib/programs/host-shop-network';
import HostShopPlacementGuideClient from './HostShopPlacementGuideClient';

export default async function HostShopPlacementGuide({ programSlug }: { programSlug: string }) {
  const network = await getHostShopNetwork();
  const shops = network.filter((shop) => matchesHostShopProgram(shop, programSlug));
  return <HostShopPlacementGuideClient programSlug={programSlug} shops={shops} />;
}
