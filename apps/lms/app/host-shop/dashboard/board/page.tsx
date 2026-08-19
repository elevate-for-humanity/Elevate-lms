import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Legacy compatibility route.
 * The canonical Host Shop dashboard lives at /host-shop/dashboard.
 */
export default function LegacyHostShopBoardRoute() {
  redirect('/host-shop/dashboard');
}
