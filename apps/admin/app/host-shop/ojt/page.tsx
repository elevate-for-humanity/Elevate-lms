import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Host Shop OJT | Admin',
  robots: { index: false, follow: false },
};

export default function AdminHostShopOjtPage() {
  redirect('/host-shop/dashboard');
}
