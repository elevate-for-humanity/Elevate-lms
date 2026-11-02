import { ProgramHolderTaskGuide } from './ProgramHolderTaskGuide';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export async function ProgramHolderSectionLayout({ children, allowPendingApproval = false }: { children: React.ReactNode; allowPendingApproval?: boolean }) {
  // Preserve the section's full approval gate; the parent owns the single navigation shell.
  await requireProgramHolder({ allowPendingApproval });
  return (
    <div className="p-4 sm:p-6">
      <ProgramHolderTaskGuide />
      <div id="holder-task-tools" className="scroll-mt-24">
        {children}
      </div>
    </div>
  );
}
