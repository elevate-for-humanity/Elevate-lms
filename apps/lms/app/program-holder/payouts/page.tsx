import { ProgramHolderDocumentUpload } from '@/components/program-holder/ProgramHolderDocumentUpload';
import { ProgramHolderPaymentAddendum } from '@/components/program-holder/ProgramHolderPaymentAddendum';
import { PayoutAccessPanel } from '@/components/program-holder/PayoutAccessPanel';
import { ProgramHolderWorkspaceView } from '@/components/program-holder/ProgramHolderWorkspaceView';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Payouts | Program Holder',
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <>
      <ProgramHolderPaymentAddendum />
      <ProgramHolderWorkspaceView section="payouts" payoutPanel={<><PayoutAccessPanel /><details open className="rounded-2xl border bg-white p-5"><summary className="min-h-11 cursor-pointer font-bold">Submit a training invoice</summary><ProgramHolderDocumentUpload invoiceOnly /></details></>} />
    </>
  );
}
