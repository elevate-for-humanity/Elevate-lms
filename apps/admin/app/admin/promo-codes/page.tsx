import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import PromoCodesClient from './PromoCodesClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Promo Codes | Admin | Elevate For Humanity' };

export default async function PromoCodesPage() {
  await requireRole(['admin']);
  return <PromoCodesClient />;
}
