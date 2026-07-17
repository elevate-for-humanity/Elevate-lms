import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import AuditLogsPageClient from './PageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Audit Logs | Admin',
};

export default async function AuditLogsPage() {
  await requireRole(['admin', 'super_admin']);
  return <AuditLogsPageClient />;
}
