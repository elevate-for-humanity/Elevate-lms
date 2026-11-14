import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
export const dynamic = 'force-dynamic';
export default async function EmployerVerificationPage() {
  await requireRole(['employer', 'sponsor', 'admin']);
  redirect('/employer/setup');
}
