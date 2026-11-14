import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyHostShopStudentsPage() {
  redirect('/host-shop/dashboard/apprentices');
}
