import { redirect } from 'next/navigation';

/**
 * Compatibility entry point retained for previously issued Host Shop links.
 * The canonical authenticated surface lives at /host-shop/dashboard.
 */
export default function CosmetologyHostShopDashboardCompatibilityPage() {
  redirect('/host-shop/dashboard');
}
