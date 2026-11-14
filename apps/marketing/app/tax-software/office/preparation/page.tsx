import type { Metadata } from 'next';
import { TaxSiteShell } from '../../_components/TaxSiteShell';
import { ProfessionalWorkspace } from './ProfessionalWorkspace';
export const metadata: Metadata = {
  title: 'Professional Tax Preparation | Supersonic Fast Cash',
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <TaxSiteShell>
      <main className="min-h-screen bg-slate-50 px-5 py-9 text-slate-950 sm:px-10">
        <ProfessionalWorkspace />
      </main>
    </TaxSiteShell>
  );
}
