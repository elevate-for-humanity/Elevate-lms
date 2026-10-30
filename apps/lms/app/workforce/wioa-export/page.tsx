import Link from 'next/link';
import { getWorkforceWorkspace } from '@/lib/workforce/workspace';
import { enrollmentSummary } from '@/lib/workforce/records';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'WIOA Export | Workforce Portal',
  robots: { index: false, follow: false },
};
export default async function ExportPage() {
  const { enrollments } = await getWorkforceWorkspace();
  const summary = enrollmentSummary(enrollments);
  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold">WIOA Export</h1>
      <p>
        Export enrollment and placement records for workforce reporting review. Each row represents
        one enrollment; multiple enrollments for the same participant remain separate.
      </p>
      <p>
        {summary.participants} participants · {summary.enrollments} enrollments ·{' '}
        {summary.completed} completions
      </p>
      <a
        className="inline-flex min-h-11 items-center rounded bg-slate-900 px-4 text-white"
        href="/workforce/wioa-export/download"
      >
        Download enrollment and placement CSV
      </a>
      <p>
        Includes participant name and email, program, enrollment status, funding source, training
        dates, and recorded placement status. Missing data is left blank.
      </p>
      <Link className="block underline" href="/workforce/dashboard">
        Back to dashboard
      </Link>
    </section>
  );
}
