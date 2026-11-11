import type { Metadata } from 'next';
import Link from 'next/link';
import { TaxSiteShell, taxButton } from '../../_components/TaxSiteShell';
export const metadata: Metadata = {
  title: 'Tax & payroll services | Supersonic Fast Cash',
  robots: { index: false, follow: false },
};
const services = [
  {
    title: 'Professional tax preparation',
    href: '/tax-software/office/preparation',
    description:
      'Open assigned clients, prepare federal worksheets, save calculations, send work to review and download the saved preparation record.',
  },
  {
    title: 'Payroll preparation',
    href: '/tax-software/office/payroll',
    description:
      'Manage separate client companies and employees, calculate supported regular Indiana wages, reopen drafts, approve review exports and retain an audit history.',
  },
  {
    title: 'Staff reports and training',
    href: '/tax-software/office',
    description:
      'Review office worklists, client inquiries, assigned staff, recruiting and knowledge-check progress.',
  },
  {
    title: 'Customer tax workspace',
    href: '/tax-software/self-file',
    description:
      'Use the account-owned taxpayer interview, income documents, household and business worksheets, calculations and supported review exports.',
  },
];
export default function ServicePage() {
  return (
    <TaxSiteShell>
      <main className="space-y-8 px-5 py-9 sm:px-10">
        <header>
          <p className="text-sm font-bold uppercase tracking-wide text-[#073ca2]">
            Supersonic Fast Cash
          </p>
          <h1 className="mt-3 text-4xl font-black">Tax & payroll services</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8">
            Choose the workspace for your next task. Professional tax records require an active
            office assignment and two-step verification. Payroll management is restricted to active
            office owners.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((s) => (
            <section key={s.href} className="flex flex-col rounded-2xl border border-slate-300 p-6">
              <h2 className="text-2xl font-bold">{s.title}</h2>
              <p className="my-5 flex-1 leading-7">{s.description}</p>
              <Link href={s.href} className={taxButton + ' bg-[#073ca2] text-white'}>
                Open workspace
              </Link>
            </section>
          ))}
        </div>
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
          <h2 className="text-2xl font-bold">Before moving money or filing</h2>
          <p className="mt-4 leading-7">
            Business and preparer approvals remain separate from a working software connection.
            Payroll drafts and export approvals do not send wages or remit payroll taxes. Tax
            preparation records and draft XML do not establish IRS acceptance. Complete the approved
            bank, tax-transmitter and acknowledgment connections before offering those actions in
            this software.
          </p>
          <p className="mt-4 leading-7">
            Refund bank products and preparation-fee payments use their own verified Supersonic
            merchant and provider arrangements. Elevate’s school payment account is not a fallback.
          </p>
        </section>
      </main>
    </TaxSiteShell>
  );
}
