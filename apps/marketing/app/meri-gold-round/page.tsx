import type { Metadata } from 'next';
import Storefront from './Storefront';

export const metadata: Metadata = {
  title: 'Meri-Gold-Round Multi-Zone Oil | Curvature Body Sculpting',
  description:
    'One oil for hair, scalp, skin, body, massage, and daily wellness. Shop Meri-Gold-Round Multi-Zone Oil from Curvature Body Sculpting.',
};

export default function MeriGoldRoundPage() {
  return <Storefront />;
}
