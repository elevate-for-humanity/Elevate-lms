import { ProgramHolderWorkspaceView } from '@/components/program-holder/ProgramHolderWorkspaceView';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'At-Risk Students',
  description: 'Review enrolled students who need immediate follow-up.',
};

export default function Page() {
  return <ProgramHolderWorkspaceView section="at-risk" />;
}
