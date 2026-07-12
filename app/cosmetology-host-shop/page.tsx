import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Cosmetology Host Shop | Elevate for Humanity',
  description: 'Host a cosmetology apprenticeship. Partner with us to train the next generation of beauty professionals.',
  robots: { index: true, follow: true },
};

export default function CosmetologyHostShopPage() {
  redirect('/partners/cosmetology-host-shop');
}
