import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** Compatibility-only route. Canonical Host Site information lives at /partners/host-shops. */
export default function LegacyBarberHostShopPage() {
  redirect('/partners/host-shops');
}
