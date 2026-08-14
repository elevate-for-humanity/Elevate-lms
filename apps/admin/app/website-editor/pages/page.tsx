import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import PageBuilderClient from './PageBuilderClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Page Manager | Admin | Elevate For Humanity' };

export default async function WebsitePagesPage() {
  await requireRole(['admin', 'staff']);
  return <PageBuilderClient />;
}
