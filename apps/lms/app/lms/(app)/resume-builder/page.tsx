import { requireRole } from '@/lib/auth/require-role';
import { ResumeBuilderPage } from './ResumeBuilderPage';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Resume Builder', robots: { index: false, follow: false } };

export default async function Page() {
  await requireRole(['student', 'learner', 'admin', 'staff']);
  return <ResumeBuilderPage />;
}
