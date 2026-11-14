import { requireRole } from '@/lib/auth/require-role';
import EmailMarketingClient from './EmailMarketingClient';

export { metadata } from './layout';
export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireRole(['admin', 'staff']);
  return <EmailMarketingClient />;
}
