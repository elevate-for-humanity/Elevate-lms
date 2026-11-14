import type { Metadata } from 'next';
import { TaxSiteShell } from '../../_components/TaxSiteShell';
import { PayrollWorkspace } from './PayrollWorkspace';
export const metadata: Metadata = {
  title: 'Payroll workspace | Supersonic Fast Cash',
  robots: { index: false, follow: false },
};
export default function PayrollPage() {
  return (
    <TaxSiteShell>
      <main className="px-5 py-9 sm:px-10">
        <PayrollWorkspace />
      </main>
    </TaxSiteShell>
  );
}
