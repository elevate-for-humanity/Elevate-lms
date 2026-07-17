import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Nail Technician Host Shop | Elevate for Humanity',
  description: 'Host a nail technician apprenticeship. Partner with us to train the next generation of nail care professionals.',
  robots: { index: false, follow: false },
};

export default function NailHostShopPage() {
  redirect('/partners/nail-host-shop');
}
