import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Course Creator',
  description: 'Create and manage training courses.',
  robots: { index: false, follow: false },
};

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['creator', 'admin', 'super_admin']);
  return <>{children}</>;
}
