import { PayoutAccessPanel } from '@/components/program-holder/PayoutAccessPanel';
import { ProgramHolderWorkspaceView } from '@/components/program-holder/ProgramHolderWorkspaceView';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Payouts | Program Holder', robots: { index: false, follow: false } };
export default function Page() { return <ProgramHolderWorkspaceView section="payouts" payoutPanel={<PayoutAccessPanel />} />; }

