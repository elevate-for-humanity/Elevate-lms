import { requireRole } from '@/lib/auth/require-role';

export default async function CourseCreationLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['admin', 'super_admin']);
  return children;
}
