import { requireAdmin } from '@/lib/auth';
import SalesforceClient from './SalesforceClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function SalesforcePage() {
  await requireAdmin();
  return <SalesforceClient />;
}
