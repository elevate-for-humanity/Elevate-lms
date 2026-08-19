import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** Compatibility-only route. Canonical Host Site portal lives at /host-shop/dashboard. */
export default function LegacyCosmetologyHostShopDashboardPage() {
  redirect('/host-shop/dashboard');
}
