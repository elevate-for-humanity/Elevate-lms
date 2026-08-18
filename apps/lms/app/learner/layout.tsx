import LearnerWorkspaceLayout from '@/components/lms/LearnerWorkspaceLayout';

export const dynamic = 'force-dynamic';

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  return <LearnerWorkspaceLayout>{children}</LearnerWorkspaceLayout>;
}
