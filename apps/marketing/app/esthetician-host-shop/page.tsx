import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Esthetician Host Shop',
  description: 'Host an esthetician apprenticeship. Partner with us to train the next generation of skincare professionals.',
  robots: { index: false, follow: false },
};

export default function EstheticianHostShopPage() {
  redirect('/partners/esthetician-host-shop');
}
