import type { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Hours Export | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminHoursExportPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
      <nav aria-label="Hours export navigation" className="flex flex-wrap gap-4 text-sm underline">
        <Link href="/student-hours">Back to Student Hours</Link>
        <Link href="/dashboard">Admin dashboard</Link>
      </nav>
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Hours Export</h1>
        <p className="mt-2 text-slate-600">
          Download the on-the-job training entries shown in Student Hours, including their
          current review status. Only verified entries count as approved OJT hours.
        </p>
      </header>
      <form action="/api/admin/apprenticeships/hours/export" method="get" className="space-y-5 rounded-xl border bg-white p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2 font-medium">
            Start date
            <input type="date" name="start_date" required defaultValue={`${today.slice(0, 7)}-01`} className="min-h-11 rounded-lg border p-3" />
          </label>
          <label className="flex flex-col gap-2 font-medium">
            End date
            <input type="date" name="end_date" required defaultValue={today} className="min-h-11 rounded-lg border p-3" />
          </label>
        </div>
        <label className="flex flex-col gap-2 font-medium">
          Review status
          <select name="status" defaultValue="all" className="min-h-11 rounded-lg border p-3">
            <option value="all">All entries</option>
            <option value="verified">Verified entries only</option>
            <option value="submitted">Submitted for review</option>
          </select>
        </label>
        <p className="text-sm text-slate-600">
          Dates include both the start and end day. The CSV contains student names and email
          addresses; share it only with authorized recipients.
        </p>
        <button type="submit" className="min-h-11 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white">
          Download OJT hours CSV
        </button>
      </form>
    </div>
  );
}
