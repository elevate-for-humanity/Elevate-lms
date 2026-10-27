import { ProgramHolderWorkspaceView } from '@/components/program-holder/ProgramHolderWorkspaceView';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="min-w-0 [&_input:not([type='hidden']):not([type='file'])]:min-h-8 [&_input:not([type='hidden']):not([type='file'])]:min-w-8">
      <ProgramHolderWorkspaceView section="documents" />
    </div>
  );
}
