'use client';

import { useState } from 'react';

type ProgramOption = { id: string; slug: string; title: string };
type PreviewApplicant = {
  application_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  applied_at: string | null;
  application_status: string | null;
};
type Preview = {
  selected: PreviewApplicant[];
  skipped_counts: Record<string, number>;
  assigned_total_for_holder: number;
  message?: string;
};

export function AssignApplicantsPanel({
  holderId,
  holderName,
  programs,
  assignedCount,
}: {
  holderId: string;
  holderName: string;
  programs: ProgramOption[];
  assignedCount: number;
}) {
  const [programSlug, setProgramSlug] = useState(
    programs.find((p) => p.slug === 'cna')?.slug ?? programs[0]?.slug ?? '',
  );
  const [limit, setLimit] = useState(50);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);

  async function call(dryRun: boolean) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(
        `/api/admin/program-holders/${holderId}/assign-applicants`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ program_slug: programSlug, limit, dry_run: dryRun }),
        },
      );
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Your session or connection changed. Reload the page and try again.');
      }
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'The assignment could not be completed.');
      setPreview({
        selected: result.selected ?? [],
        skipped_counts: result.skipped_counts ?? {},
        assigned_total_for_holder: result.assigned_total_for_holder ?? assignedCount,
        message: result.message,
      });
      setMessage(
        result.message ||
          (dryRun ? 'Preview ready — nothing was assigned.' : 'Applicants assigned.'),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The request could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  if (!programs.length) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Assign applicants</h2>
        <p className="mt-2 text-sm text-slate-600">
          This holder has no active assigned programs, so there is nothing to route to them yet.
        </p>
      </section>
    );
  }

  const skippedTotal = preview
    ? Object.values(preview.skipped_counts).reduce((sum, n) => sum + Number(n || 0), 0)
    : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Assign applicants</h2>
      <p className="mt-1 text-sm text-slate-600">
        Route student applications to {holderName}. The batch rule is the earliest-submitted
        applications for the selected program, deduplicated by applicant, excluding anyone
        already assigned to a holder or already enrolled. Nothing is picked at random.
        Currently {assignedCount} applicant{assignedCount === 1 ? '' : 's'} assigned to this
        holder.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm font-black text-slate-900">
          Program
          <select
            value={programSlug}
            onChange={(event) => setProgramSlug(event.target.value)}
            className="mt-2 block rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
          >
            {programs.map((program) => (
              <option key={program.id} value={program.slug}>
                {program.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-black text-slate-900">
          Batch size
          <input
            type="number"
            min={1}
            max={500}
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value) || 50)}
            className="mt-2 block w-24 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
          />
        </label>
        <button
          type="button"
          disabled={busy || !programSlug}
          onClick={() => call(true)}
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Preview the batch'}
        </button>
        <button
          type="button"
          disabled={busy || !programSlug || !preview?.selected.length}
          onClick={() => call(false)}
          className="rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-black text-white hover:bg-indigo-800 disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Assign the previewed batch'}
        </button>
      </div>

      {message && (
        <p role="status" className="mt-3 text-sm font-bold text-slate-800">
          {message}
        </p>
      )}

      {preview && (
        <div className="mt-4">
          <p className="text-sm font-bold text-slate-800">
            {preview.selected.length} applicant{preview.selected.length === 1 ? '' : 's'} selected
            {skippedTotal > 0 ? ` · ${skippedTotal} skipped` : ''} ·{' '}
            {preview.assigned_total_for_holder} total assigned to this holder after this batch.
          </p>
          {skippedTotal > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Skipped — wrong status: {preview.skipped_counts.wrong_status ?? 0} · revoked:{' '}
              {preview.skipped_counts.revoked ?? 0} · already assigned:{' '}
              {preview.skipped_counts.already_assigned ?? 0} · already enrolled:{' '}
              {preview.skipped_counts.already_enrolled ?? 0} · duplicate:{' '}
              {preview.skipped_counts.duplicate ?? 0} · past the batch limit:{' '}
              {preview.skipped_counts.beyond_limit ?? 0}
            </p>
          )}
          {preview.selected.length > 0 && (
            <div className="mt-3 max-h-80 overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-2">Applicant</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Applied</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.selected.map((row) => (
                    <tr key={row.application_id}>
                      <td className="px-4 py-2 font-bold">{row.name}</td>
                      <td className="px-4 py-2">{row.email || '—'}</td>
                      <td className="px-4 py-2">
                        {row.applied_at ? new Date(row.applied_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-2 capitalize">
                        {String(row.application_status || 'submitted').replaceAll('_', ' ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
