import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { WorkforceOverview } from '@/components/workforce/WorkforceOverview';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Workforce Development | Admin',
  robots: { index: false, follow: false },
};
export default async function WorkforcePage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return (
    <main className="space-y-8 p-6">
      <WorkforceOverview admin />
      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-xl font-bold">Administrative tools</h2>
        <nav className="mt-4 flex flex-wrap gap-4" aria-label="Workforce administration">
          <Link className="underline" href="/workforce/participants">
            Participants and separate intake records
          </Link>
          <Link className="underline" href="/workforce/participants/new">
            Add intake record
          </Link>
          <Link className="underline" href="/workforce/cases">
            Cases
          </Link>
          <Link className="underline" href="/workforce/reports">
            Reports
          </Link>
          <Link className="underline" href="/workforce/outcomes">
            Outcomes
          </Link>
          <Link className="underline" href="/workforce/compliance">
            Compliance
          </Link>
        </nav>
      </section>
    </main>
  );
}
