import type { Metadata } from 'next';
import Storefront from './Storefront';

export const metadata: Metadata = {
  title: { absolute: 'Meri-Gold-Round Multi-Zone Essential Oil | Curvature Body Sculpting' },
  description:
    'One essential oil for hair, scalp, skin, body, massage, and daily wellness. Shop Meri-Gold-Round from Curvature Body Sculpting.',
  applicationName: 'Curvature Body Sculpting',
  openGraph: {
    siteName: 'Curvature Body Sculpting',
    title: 'Meri-Gold-Round Multi-Zone Essential Oil',
    description: 'One oil. Whole body. Total care.',
    type: 'website',
    images: [{ url: '/images/meri-gold-round/product-lineup.webp', alt: 'Meri-Gold-Round essential oil rollerballs and packaging' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meri-Gold-Round Multi-Zone Essential Oil',
    description: 'One oil. Whole body. Total care.',
    images: ['/images/meri-gold-round/product-lineup.webp'],
  },
};

export default function MeriGoldRoundPage() {
  return <Storefront />;
}
