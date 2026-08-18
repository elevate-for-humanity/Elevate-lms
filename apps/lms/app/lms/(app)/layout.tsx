import CanonicalLearnerWorkspaceLayout from '@/components/lms/LearnerWorkspaceLayout';

export const dynamic = 'force-dynamic';

/**
 * Authenticated learner workspace boundary. The LMS middleware blocks anonymous
 * access before render; this layout adds role authorization and the canonical
 * learner navigation shell for every route in the (app) group.
 */
export default async function LearnerWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <CanonicalLearnerWorkspaceLayout>{children}</CanonicalLearnerWorkspaceLayout>;
}
