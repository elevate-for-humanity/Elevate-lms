import { ProgramHolderWorkspaceView } from '@/components/program-holder/ProgramHolderWorkspaceView';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pending Students | Program Holder', robots: { index: false, follow: false } };
export default function Page() { return <ProgramHolderWorkspaceView section="pending" />; }
