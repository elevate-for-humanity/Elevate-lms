import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** Compatibility-only route. Canonical Host Site application lives at /partners/host-shop/apply. */
export default function LegacyBarberHostShopApplyPage() {
  redirect('/partners/host-shop/apply');
}
