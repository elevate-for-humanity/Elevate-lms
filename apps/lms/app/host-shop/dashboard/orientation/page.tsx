import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyHostShopOrientationRoute() {
  redirect('/host-shop/orientation');
}
