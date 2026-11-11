import { getProgramHeroImage } from '@/lib/images/programImages';
import { matchesHostShopProgram } from '@/lib/programs/host-shop-programs';
import { getHostShopNetwork } from '@/lib/programs/host-shop-network';
import HostShopPlacementGuideClient from './HostShopPlacementGuideClient';

export default async function HostShopPlacementGuide({ programSlug }: { programSlug: string }) {
  const network = await getHostShopNetwork(true);
  const heroImage = getProgramHeroImage(programSlug);
  const shops = network.filter((shop) => matchesHostShopProgram(shop, programSlug)).map((shop) => {
    const gallery = shop.gallery?.filter((photo) => photo.url !== heroImage);
    return { ...shop, gallery, image: gallery?.[0]?.url };
  });
  return <HostShopPlacementGuideClient programSlug={programSlug} shops={shops} />;
}
