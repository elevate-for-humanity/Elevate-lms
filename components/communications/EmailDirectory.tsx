'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

export type EmailDirectoryRow = {
  id: string;
  address: string;
  displayName: string;
  mailboxKind: string;
  active: boolean;
  members: string[];
};

export function EmailDirectory({
  rows,
  openHrefBase = '/phone/email',
}: {
  rows: EmailDirectoryRow[];
  openHrefBase?: string;
}) {
  const [query, setQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (!showInactive && !row.active) return false;
      if (!needle) return true;
      return [row.address, row.displayName, row.mailboxKind, ...row.members]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [query, rows, showInactive]);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">Email directory</h2>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Every personal, organization, and shared mailbox is visible here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search mailboxes"
              className="min-h-10 rounded-xl border border-slate-300 pl-9 pr-3 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => setShowInactive((value) => !value)}
            className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-black text-slate-700"
          >
            {showInactive ? 'Hide inactive' : 'Show inactive'}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-5 py-3">Mailbox</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Members</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((row) => (
              <tr key={row.id}>
                <td className="px-5 py-4">
                  {row.active ? (
                    <Link
                      href={`${openHrefBase}?mailboxId=${encodeURIComponent(row.id)}`}
                      className="block rounded-lg outline-none ring-blue-500 focus-visible:ring-2"
                    >
                      <span className="block font-black text-blue-800 hover:underline">
                        {row.displayName}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-600">{row.address}</span>
                    </Link>
                  ) : (
                    <>
                      <p className="font-black text-slate-950">{row.displayName}</p>
                      <p className="mt-0.5 text-xs text-slate-600">{row.address}</p>
                    </>
                  )}
                </td>
                <td className="px-5 py-4 font-semibold capitalize text-slate-700">
                  {row.mailboxKind.replace('_', ' ')}
                </td>
                <td className="px-5 py-4 text-slate-700">
                  {row.members.length ? row.members.join(', ') : 'No active member'}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-black ${row.active ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}
                  >
                    {row.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? (
          <p className="p-8 text-center text-sm font-semibold text-slate-500">
            No mailboxes match this view.
          </p>
        ) : null}
      </div>
    </section>
  );
}
