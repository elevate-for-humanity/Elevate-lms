import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Host Shop Apprentices | Admin',
  robots: { index: false, follow: false },
};

export default function AdminHostShopApprenticesPage() {
  redirect('/host-shop/dashboard/apprentices');
}
