import { requireRole } from '@/lib/auth/require-role';
import PurchasedMediaPlugin from '@/components/studio/plugins/PurchasedMediaPlugin';

export const dynamic = 'force-dynamic';

export default async function PurchasedMediaPluginPage() {
  await requireRole(['admin']);
  return <PurchasedMediaPlugin />;
}
