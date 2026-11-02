import { ProgramHolderSectionLayout } from '@/components/program-holder/ProgramHolderSectionLayout';

/** The approval-pending destination must be reachable before approval. */
export default function ProgramHolderOnboardingLayout({ children }: { children: React.ReactNode }) {
  return <ProgramHolderSectionLayout allowPendingApproval>{children}</ProgramHolderSectionLayout>;
}
