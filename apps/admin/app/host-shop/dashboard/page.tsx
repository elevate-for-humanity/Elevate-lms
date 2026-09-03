import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getLmsUrl } from '@/lib/utils/siteUrl';

export const metadata: Metadata = {
  title: 'Host Shop Dashboard',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function HostShopDashboardRedirect() {
  redirect(`${getLmsUrl()}/host-shop/dashboard`);
}
