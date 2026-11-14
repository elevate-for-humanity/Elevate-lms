import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Host Shop Reports | Admin',
  robots: { index: false, follow: false },
};

export default function AdminHostShopReportsPage() {
  redirect('/host-shop/dashboard/reports');
}
