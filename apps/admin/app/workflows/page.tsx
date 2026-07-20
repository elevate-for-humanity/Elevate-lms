export const metadata = { robots: { index: false } };

import { redirect } from 'next/navigation';
export const metadata = { robots: { index: false } };

import { requireRole } from '@/lib/auth/require-role';
export const metadata = { robots: { index: false } };

import { PERMISSIONS } from '@/lib/rbac/role-matrix';

export default async function WorkflowsPage() {
  await requireRole(PERMISSIONS.access_devstudio);
  redirect('/admin/studio/workflows');
}
