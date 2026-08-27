import CanonicalLearnerWorkspaceLayout from '@/components/lms/LearnerWorkspaceLayout';

export const dynamic = 'force-dynamic';

export default async function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <CanonicalLearnerWorkspaceLayout>{children}</CanonicalLearnerWorkspaceLayout>;
}
