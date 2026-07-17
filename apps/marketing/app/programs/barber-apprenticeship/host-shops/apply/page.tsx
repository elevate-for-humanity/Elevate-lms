import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Apply to be a Host Shop | Barber Apprenticeship',
  description: 'Apply to become a host shop for barber apprentices.',
  robots: { index: false, follow: false },
};

export default function HostShopApplyPage() {
  redirect('/partners/barber-host-shop/apply');
}
