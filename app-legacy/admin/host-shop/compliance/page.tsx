import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Host Shop Compliance | Admin',
  robots: { index: false, follow: false },
};

export default function AdminHostShopCompliancePage() {
  redirect('/host-shop/dashboard');
}
