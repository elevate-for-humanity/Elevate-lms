import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import QuickBooksClient from './QuickBooksClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'QuickBooks Integration | Admin | Elevate For Humanity',
};

export default async function QuickBooksPage() {
  await requireRole(['admin']);
  return <QuickBooksClient />;
}
