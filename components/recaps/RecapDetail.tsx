"use client";

import React from 'react';

import { useEffect, useState } from 'react';

type Recap = {
  id: string;
  title: string;
  meeting_date: string | null;
  attendee_email: string | null;
  summary: string | null;
  key_points: string[];
  decisions: string[];
  follow_up_email: string | null;
  created_at: string;
};

type Item = {
  id: string;
  label: string;
  due_date: string | null;
  completed_at: string | null;
};

export default function RecapDetail({ recapId }: { recapId: string }) {
  const [recap, setRecap] = useState<Recap | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/recaps/${recapId}`);
    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setRecap(null);
      setItems([]);
      return;
    }
    setRecap(json.recap);
    setItems(json.items || []);
  }

  async function toggle(itemId: string) {
    const res = await fetch(`/api/recaps/action-items/${itemId}/toggle`, {
      method: 'POST',
    });
    if (!res.ok) return;
    await load();
  }

  useEffect(() => {
    load();
  }, [recapId]);

  if (loading)
    return <div className="text-sm text-neutral-600">Loading recap…</div>;
  if (!recap)
    return <div className="text-sm text-neutral-600">Recap not found.</div>;

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight">{recap.title}</h1>
          <div className="text-xs text-neutral-600">
            {recap.meeting_date
              ? new Date(recap.meeting_date).toLocaleString('en-US')
              : 'No meeting date'}
            {recap.attendee_email ? ` • ${recap.attendee_email}` : ''}
          </div>
        </div>

        {recap.summary ? (
          <div className="mt-4">
            <div className="text-xs font-semibold text-neutral-700 mb-2">
              Summary
            </div>
            <p className="text-sm leading-relaxed text-neutral-900">
              {recap.summary}
            </p>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-neutral-700 mb-3">
            Key points
          </div>
          <ul className="grid gap-2">
            {(recap.key_points || []).map((x, i) => (
              <li key={i} className="text-sm text-neutral-900 leading-relaxed">
                • {x}
              </li>
            ))}
            {!recap.key_points || recap.key_points.length === 0 ? (
              <li className="text-sm text-neutral-500">No key points.</li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-neutral-700 mb-3">
            Decisions
          </div>
          <ul className="grid gap-2">
            {(recap.decisions || []).map((x, i) => (
              <li key={i} className="text-sm text-neutral-900 leading-relaxed">
                • {x}
              </li>
            ))}
            {!recap.decisions || recap.decisions.length === 0 ? (
              <li className="text-sm text-neutral-500">No decisions.</li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-neutral-700">
            Action items
          </div>
          <button onClick={load} className="text-xs font-semibold underline">
            Refresh
          </button>
        </div>

        <div className="grid gap-2">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => toggle(it.id)}
              className="flex items-start gap-3 rounded-xl border p-3 text-left hover:bg-neutral-50"
            >
              <div
                className={`mt-0.5 h-4 w-4 rounded border ${
                  it.completed_at ? 'bg-black' : 'bg-white'
                }`}
              />
              <div className="flex-1">
                <div className="text-sm font-semibold text-neutral-900">
                  {it.label}
                </div>
                <div className="text-xs text-neutral-600 mt-1">
                  {it.due_date ? `Due: ${it.due_date}` : 'No due date'}
                  {it.completed_at ? ' • Completed' : ''}
                </div>
              </div>
            </button>
          ))}
          {items.length === 0 ? (
            <div className="text-sm text-neutral-600">No action items.</div>
          ) : null}
        </div>
      </div>

      {recap.follow_up_email ? (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-neutral-700 mb-3">
            Follow-up email draft
          </div>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-900">
            {recap.follow_up_email}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
