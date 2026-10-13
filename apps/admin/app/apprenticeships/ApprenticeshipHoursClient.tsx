'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';
import {
  formatHoursDate,
  hoursApprovalSnapshot,
  roundHours,
  type AdminHoursEntry,
} from '@/lib/apprenticeship/admin-hours-model';

export default function ApprenticeshipHoursClient() {
  const router = useRouter();
  const [entries, setEntries] = useState<AdminHoursEntry[]>([]);
  const [incompleteCount, setIncompleteCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [review, setReview] = useState<AdminHoursEntry[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/apprenticeships/pending-hours', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load hours');
      setEntries(data.entries);
      setIncompleteCount(data.incompleteCount);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load hours. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  const eligible = entries.filter((e) => !e.approval_blocker);

  const approve = async (selected: AdminHoursEntry[]) => {
    setBusy(true);
    setReview(null);
    setError(null);
    setNotice(null);
    let approved = 0;
    let failure: string | null = null;
    try {
      // Approve only the IDs displayed and reviewed, never a server-side wildcard.
      for (let offset = 0; offset < selected.length; offset += 200) {
        const ids = selected.slice(offset, offset + 200).map((e) => e.id);
        const res = await fetch('/api/admin/apprenticeships/hours/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ids,
            expected: selected.slice(offset, offset + 200).map(hoursApprovalSnapshot),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Could not confirm approval');
        approved += data.approvedCount;
      }
      setNotice(`${approved} ${approved === 1 ? 'entry approved' : 'entries approved'}.`);
    } catch (e) {
      failure = `${approved ? `${approved} entries were approved. ` : ''}${e instanceof Error ? e.message : 'Approval failed'}`;
    } finally {
      await load();
      router.refresh();
      setError(failure);
      setBusy(false);
    }
  };

  return (
    <section
      className="overflow-hidden rounded-2xl border border-amber-200 bg-white"
      aria-label="Hours approval queue"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-5 py-4">
        <div>
          <h2 className="font-semibold text-slate-900">Hours awaiting review</h2>
          <p className="mt-1 text-sm text-slate-600">
            {eligible.length} ready to approve · {entries.length - eligible.length} need review
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              void load();
              router.refresh();
            }}
            disabled={busy || loading}
            aria-label="Refresh hours"
            className="rounded-lg border border-slate-300 p-2 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setReview([...eligible])}
            disabled={busy || loading || !!loadError || !!review || !eligible.length}
            className="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Approve all eligible ({eligible.length})
          </button>
        </div>
      </div>
      {loading && (
        <p role="status" className="flex items-center gap-2 px-5 py-3 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading hours…
        </p>
      )}
      {busy && (
        <p role="status" className="px-5 py-3 text-sm">
          Saving approvals…
        </p>
      )}
      {(loadError || error) && (
        <p role="alert" className="px-5 py-3 text-sm text-red-700">
          {loadError || error}
        </p>
      )}
      {notice && (
        <p role="status" className="px-5 py-3 text-sm text-green-700">
          {notice}
        </p>
      )}
      {review && (
        <div
          role="alertdialog"
          aria-label="Confirm hour approvals"
          className="m-4 rounded-xl border border-green-300 bg-green-50 p-4"
        >
          <p className="font-semibold">
            Approve {review.length} entries totaling{' '}
            {roundHours(review.reduce((sum, e) => sum + e.hours_worked, 0))} hours?
          </p>
          <p className="mt-1 text-sm">
            Your approval will be recorded for the entries shown below.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void approve(review)}
              className="rounded-lg bg-green-700 px-3 py-2 text-sm text-white"
            >
              Confirm approvals
            </button>
            <button
              type="button"
              onClick={() => setReview(null)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {!loading && !loadError && !entries.length && (
        <p className="px-5 py-6 text-sm text-slate-600">No completed hours awaiting approval.</p>
      )}
      {!!entries.length && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Apprentice', 'Program', 'Work date', 'Hours', 'Notes / review', 'Action'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-600"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{e.name}</p>
                    <p className="text-xs text-slate-500">{e.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{e.program_title}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">
                    {formatHoursDate(e.work_date)}
                    <p className="text-slate-500">Week ending {formatHoursDate(e.week_ending)}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold">{e.hours_worked}h</td>
                  <td className="max-w-sm px-4 py-3 text-xs">
                    <p>{e.notes || e.tasks_completed || '—'}</p>
                    {e.approval_blocker && (
                      <p className="mt-1 font-medium text-amber-800">{e.approval_blocker}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setReview([e])}
                      aria-label={`Approve ${e.name} ${e.work_date} ${e.hours_worked} hours`}
                      disabled={busy || loading || !!loadError || !!review || !!e.approval_blocker}
                      className="rounded-lg bg-green-100 px-3 py-2 text-xs font-semibold text-green-800 disabled:opacity-40"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {incompleteCount > 0 && (
        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          {incompleteCount} incomplete entries have no completed hours to approve. They remain in
          the student history.
        </p>
      )}
    </section>
  );
}
