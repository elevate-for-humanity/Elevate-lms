import type { Metadata } from 'next';
import { TaxSiteShell } from '../_components/TaxSiteShell';
import { Workspace } from './Workspace';
export const metadata: Metadata = {
  title: 'Office Reports & Staff Training | Supersonic Fast Cash',
  robots: { index: false, follow: false },
};
export default function TaxOffice() {
  return (
    <TaxSiteShell>
      <main className="px-5 py-9 sm:px-10">
        <p className="text-sm font-bold uppercase tracking-wide text-[#073ca2]">
          Supersonic Fast Cash · Office operations
        </p>
        <h1 className="mb-7 mt-3 text-4xl font-black">Your team. Your tax season.</h1>
        <Workspace />
      </main>
    </TaxSiteShell>
  );
}
