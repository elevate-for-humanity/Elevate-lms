import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWorkforceWorkspace } from '@/lib/workforce/workspace';
import { learnerId } from '@/lib/workforce/records';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Participant | Workforce Portal',
  robots: { index: false, follow: false },
};
export default async function ParticipantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { enrollments } = await getWorkforceWorkspace();
  const rows = enrollments.filter((row) => learnerId(row) === id);
  if (!rows.length) notFound();
  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold">{rows[0].profile?.full_name ?? 'Participant'}</h1>
      <p>{rows[0].profile?.email}</p>
      {rows.map((row) => (
        <article className="rounded-xl border bg-white p-5" key={row.id}>
          <h2 className="text-xl font-semibold">{row.program?.title ?? 'Program not recorded'}</h2>
          <dl className="mt-3 grid grid-cols-2 gap-2">
            <dt>Status</dt>
            <dd>{row.enrollment_state}</dd>
            <dt>Start date</dt>
            <dd>{row.training_start_date ?? row.started_at ?? 'Not recorded'}</dd>
            <dt>End date</dt>
            <dd>{row.training_end_date ?? 'Not recorded'}</dd>
            <dt>Completed</dt>
            <dd>{row.completed_at ?? 'Not recorded'}</dd>
            <dt>Funding</dt>
            <dd>{row.funding_source ?? 'Not recorded'}</dd>
            <dt>At risk</dt>
            <dd>{row.at_risk ? 'Yes' : 'No'}</dd>
          </dl>
        </article>
      ))}
      <Link className="underline" href="/workforce/participants">
        Back to participants
      </Link>
    </section>
  );
}
