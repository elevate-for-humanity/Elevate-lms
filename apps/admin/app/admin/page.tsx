import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function AdminLandingPage() {
  // Canonical landing route is /admin/dashboard.
  await requireRole(['admin', 'super_admin', 'staff', 'platform_operator']);
  redirect('/admin/dashboard');
}
