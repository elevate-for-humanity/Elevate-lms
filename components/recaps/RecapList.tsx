"use client";

import React from 'react';

import { useEffect, useState } from 'react';

type Recap = {
  id: string;
  title: string;
  meeting_date: string | null;
  attendee_email: string | null;
  created_at: string;
};

export default function RecapList() {
  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/recaps/list');
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setRecaps([]);
      return;
    }
    setRecaps(json.recaps || []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Recent recaps</h2>
        <button onClick={load} className="text-xs font-semibold underline">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-neutral-500">Loading…</div>
      ) : null}

      {!loading && recaps.length === 0 ? (
        <div className="text-sm text-neutral-600">
          No recaps yet. Create your first one.
        </div>
      ) : null}

      <div className="grid gap-3">
        {recaps.map((r) => (
          <a
            key={r.id}
            href={`/dashboard/recaps/${r.id}`}
            className="rounded-xl border p-3 hover:bg-neutral-50 transition"
          >
            <div className="font-semibold text-sm">{r.title}</div>
            <div className="text-xs text-neutral-600 mt-1">
              {r.meeting_date
                ? new Date(r.meeting_date).toLocaleString('en-US')
                : 'No meeting date'}
              {r.attendee_email ? ` • ${r.attendee_email}` : ''}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
