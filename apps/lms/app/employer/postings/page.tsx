import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';

export default async function EmployerPostingsPage() {
  await requireRole(['employer', 'sponsor', 'admin', 'super_admin']);
  redirect('/employer/jobs');
}
