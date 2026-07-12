import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Esthetician Host Shop | Elevate for Humanity',
  description: 'Host an esthetician apprenticeship. Partner with us to train the next generation of skincare professionals.',
  robots: { index: true, follow: true },
};

export default function EstheticianHostShopPage() {
  redirect('/partners/esthetician-host-shop');
}
