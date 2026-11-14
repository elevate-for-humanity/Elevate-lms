'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Match = {
  id: string;
  status: string;
  program_slug: string;
  created_at: string | null;
  apprentice: { full_name: string; email: string | null } | null;
};
type Pagination = { page: number; pages: number; total: number };

export default function HostShopMatchRequestsPage() {
  const [requests, setRequests] = useState<Match[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pages: 0, total: 0 });
  const [filter, setFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        '/api/host-shop/match-requests?' + new URLSearchParams({
          page: String(page), limit: '10', status: filter,
        }),
        { cache: 'no-store' },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load assigned requests.');
      setRequests(Array.isArray(data.requests) ? data.requests : []);
      setPagination(data.pagination || { page, pages: 0, total: 0 });
    } catch (cause) {
      setRequests([]);
      setError(cause instanceof Error ? cause.message : 'Unable to load assigned requests.');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { void load(); }, [load]);

  async function respond(id: string, status: 'approved' | 'declined') {
    setBusy(id);
    setError('');
    try {
      const response = await fetch('/api/host-shop/match-requests/' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save your response.');
      // Always reload the authorized server projection after a change.
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save your response.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 px-3 py-5 sm:px-6 sm:py-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Host Shop</p>
        <h1 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">Assigned match requests</h1>
        <p className="mt-2 text-sm text-slate-600">
          Only requests addressed to your approved shop are listed. Student applications,
          private intake answers and other shops' records are never shown here.
        </p>
        <Link className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-blue-800 underline"
          href="/host-shop/dashboard/apprentices">View my assigned students</Link>
      </header>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter match requests">
        {[
          ['pending', 'Pending'],
          ['approved', 'Approved'],
          ['declined', 'Declined'],
          ['all', 'All'],
        ].map(([value, label]) => (
          <button key={value} type="button" aria-pressed={filter === value}
            onClick={() => { setFilter(value); setPage(1); }}
            className={'min-h-11 rounded-xl border px-3 text-sm font-semibold ' +
              (filter === value ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 bg-white text-slate-800')}>
            {label}
          </button>
        ))}
      </div>

      {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p> : null}
      {loading ? <p role="status" className="text-sm text-slate-600">Loading your shop requests…</p> :
        requests.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No {filter === 'all' ? '' : filter + ' '}match requests are assigned to your shop.
          </section>
        ) : (
          <div className="space-y-3">
            {requests.map(request => (
              <article key={request.id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-base font-bold text-slate-950">{request.apprentice?.full_name || 'Student'}</h2>
                    {request.apprentice?.email ? (
                      <a href={'mailto:' + request.apprentice.email}
                        className="mt-1 block break-all text-sm text-blue-800 underline">
                        {request.apprentice.email}
                      </a>
                    ) : <p className="text-sm text-slate-600">Email not provided</p>}
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">{request.status}</span>
                </div>
                {request.status === 'pending' ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" disabled={busy === request.id}
                      onClick={() => void respond(request.id, 'approved')}
                      className="min-h-11 rounded-xl bg-blue-700 px-4 text-sm font-bold text-white disabled:opacity-50">
                      Approve match
                    </button>
                    <button type="button" disabled={busy === request.id}
                      onClick={() => void respond(request.id, 'declined')}
                      className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 disabled:opacity-50">
                      Decline
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}

      {pagination.pages > 1 ? (
        <nav className="flex items-center justify-between gap-2" aria-label="Match request pages">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="min-h-11 rounded-xl border bg-white px-4 text-sm disabled:opacity-40">Previous</button>
          <p className="text-xs text-slate-600">Page {page} of {pagination.pages}</p>
          <button type="button" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}
            className="min-h-11 rounded-xl border bg-white px-4 text-sm disabled:opacity-40">Next</button>
        </nav>
      ) : null}
    </main>
  );
}
