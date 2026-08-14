export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { PERMISSIONS } from '@/lib/rbac/role-matrix';

export const metadata = { robots: { index: false } };

// Canonical workflow UI lives in Studio.
export default async function WorkflowsPage() {
  await requireRole(PERMISSIONS.access_dev_tools);
  redirect('/studio/workflows');
}
