import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Host Shop Dashboard',
  robots: { index: false, follow: false },
};

export default function HostShopDashboardRedirect() {
  redirect('https://app.elevateforhumanity.org/host-shop/dashboard');
}
