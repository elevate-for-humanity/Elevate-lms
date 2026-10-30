import Link from 'next/link';
import { StudentSearchPanel } from './StudentSearchPanel';
import { filterEnrollments, learnerId } from '@/lib/workforce/records';
import { getWorkforceWorkspace } from '@/lib/workforce/workspace';

export async function WorkforceRoster({
  params,
  admin = false,
}: {
  params: { q?: string; filter?: string; page?: string };
  admin?: boolean;
}) {
  const { enrollments } = await getWorkforceWorkspace();
  const q = (params.q ?? '').trim().slice(0, 200).toLowerCase();
  const filtered = filterEnrollments(enrollments, params.filter).filter(
    (row) =>
      !q ||
      `${row.profile?.full_name ?? ''} ${row.profile?.email ?? ''} ${row.program?.title ?? ''}`
        .toLowerCase()
        .includes(q),
  );
  const ids = [...new Set(filtered.map(learnerId).filter(Boolean))];
  const grouped = ids.map((id) => ({ id, rows: filtered.filter((row) => learnerId(row) === id) }));
  const page = Math.min(
    Math.max(1, Math.trunc(Number(params.page)) || 1),
    Math.max(1, Math.ceil(grouped.length / 50)),
  );
  const base = '/workforce/participants';
  const pageHref = (n: number) =>
    `${base}?${new URLSearchParams({ q: params.q ?? '', filter: params.filter ?? '', page: String(n) })}`;
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Workforce Participants</h1>
        <p>
          {grouped.length} participants · {filtered.length} enrollments
          {params.filter ? ` · ${params.filter}` : ''}
        </p>
      </div>
      <StudentSearchPanel action={base} defaultValue={params.q ?? ''} filter={params.filter} />
      <nav className="flex flex-wrap gap-4" aria-label="Participant filters">
        {['all', 'active', 'completed', 'at-risk'].map((filter) => (
          <Link
            key={filter}
            href={`${base}?${new URLSearchParams({ q: params.q ?? '', ...(filter === 'all' ? {} : { filter }) })}`}
            className="underline"
          >
            {filter}
          </Link>
        ))}
      </nav>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              {['Participant', 'Email', 'Programs', 'Enrollment status'].map((label) => (
                <th className="p-3 text-left" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grouped.slice((page - 1) * 50, page * 50).map(({ id, rows }) => (
              <tr className="border-t" key={id}>
                <td className="p-3">
                  <Link
                    className="font-semibold underline"
                    href={`${admin ? 'https://app.elevateforhumanity.org' : ''}/workforce/participants/${id}`}
                  >
                    {rows[0].profile?.full_name ?? 'Name not recorded'}
                  </Link>
                </td>
                <td className="p-3">{rows[0].profile?.email ?? 'Email not recorded'}</td>
                <td className="p-3">
                  {rows.map((row) => (
                    <div key={row.id}>{row.program?.title ?? 'Program not recorded'}</div>
                  ))}
                </td>
                <td className="p-3">
                  {rows.map((row) => (
                    <div key={row.id}>{row.enrollment_state ?? 'Not recorded'}</div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!grouped.length && (
        <p>No participants match these filters within your authorized workspace.</p>
      )}
      <nav className="flex gap-4" aria-label="Participant pages">
        {page > 1 && <Link href={pageHref(page - 1)}>Previous</Link>}
        <span>
          Page {page} of {Math.max(1, Math.ceil(grouped.length / 50))}
        </span>
        {page * 50 < grouped.length && <Link href={pageHref(page + 1)}>Next</Link>}
      </nav>
      {enrollments.some((row) => !learnerId(row)) && (
        <p role="status">Some enrollments have no linked learner identity and need admin review.</p>
      )}
    </section>
  );
}
