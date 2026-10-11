import type { Metadata } from 'next';
import Link from 'next/link';
import { ProgramHolderWorkspaceView } from '@/components/program-holder/ProgramHolderWorkspaceView';
import { PayoutAccessPanel } from '@/components/program-holder/PayoutAccessPanel';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { EmailAccountNotice } from '@/components/communications/EmailAccountNotice';
import { ProgramHolderDocumentUpload } from '@/components/program-holder/ProgramHolderDocumentUpload';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Program Holder Dashboard',
  description:
    'Manage enrolled students, assigned programs, hours, documents, reports, and compliance.',
  robots: { index: false, follow: false },
};
export default async function Page() {
  const context = await requireProgramHolder();
  if (context.mode === 'admin') return <AdminProgramHolderPreview />;
  const { data: holder } = await context.db
    .from('program_holders')
    .select('organization_name')
    .eq('id', context.holderId)
    .maybeSingle();
  const isCdlAcademy = holder?.organization_name === 'The CDL Academy';
  return (
    <>
      {isCdlAcademy && (
        <section className="m-4 overflow-hidden rounded-3xl bg-sky-100 sm:m-6">
          <img
            src="/images/cdl-partner/road.jpg"
            alt="Commercial tractor-trailer"
            className="h-48 w-full object-cover sm:h-72"
          />
          <div className="p-6">
            <p className="font-bold uppercase tracking-widest text-blue-800">
              CDL partner workspace
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">
              Training, applicants, and next steps in one place.
            </h1>
            <p className="mt-3 text-slate-700">
              Use your roster and application records to follow up on WorkOne appointments, funding
              decisions, and enrollment readiness.
            </p>
            <div className="mt-5 rounded-2xl bg-white p-5">
              <h2 className="text-lg font-black text-slate-950">Tuition and provider invoices</h2>
              <p className="mt-2 text-slate-700">
                Students pay Elevate through their student-specific invoice. CDL Academy invoices
                Elevate for the agreed training amount. Elevate records approved provider payments
                in the dashboard and reconciles them against the academy invoice.
              </p>
              <Link
                href="/program-holder/payouts"
                className="mt-3 inline-flex font-bold text-blue-800 underline"
              >
                Review payment status
              </Link>
              <div className="mt-4">
                <ProgramHolderDocumentUpload invoiceOnly />
              </div>
            </div>
            <Link
              href="https://www.elevateforhumanity.org/programs/cdl-training"
              className="mt-4 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
            >
              View the Elevate CDL program page
            </Link>
          </div>
        </section>
      )}
      <div className="px-4 pt-5 sm:px-6">
        <EmailAccountNotice
          href="/program-holder/email"
          userId={context.profile.id}
          accountName={`Elevate for Humanity — ${context.profile.full_name || 'Program Holder'}`}
        />
      </div>
      <ProgramHolderWorkspaceView
        section="dashboard"
        payoutPanel={context.mode === 'holder' ? <PayoutAccessPanel /> : undefined}
      />
    </>
  );
}

function AdminProgramHolderPreview() {
  const modules = [
    'Programs',
    'Student Rosters',
    'Training Hours',
    'Documents',
    'Compliance',
    'Payouts',
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="w-full max-w-none space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
            Administrator portal preview
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Program Holder PWA</h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-700">
            The Program Holder app is available, but this neutral preview is not attached to a
            provider, student roster, training record, compliance file, or payout account. Select a
            Program Holder in Admin to enter an audited provider-specific view.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="https://admin.elevateforhumanity.org/program-holders"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
            >
              Select a Program Holder in Admin
            </Link>
            <Link
              href="https://admin.elevateforhumanity.org/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950"
            >
              Return to Admin dashboard
            </Link>
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((label) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="font-black text-slate-950">{label}</h2>
              <p className="mt-1 text-sm text-slate-600">
                Available after an authorized Program Holder is selected.
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
