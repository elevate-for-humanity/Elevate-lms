import { requireRole } from '@/lib/auth/require-role';
import EmailMarketingClient from './EmailMarketingClient';

export { metadata } from './layout';
export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function Page() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return <EmailMarketingClient />;
}
