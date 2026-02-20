"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useEffect, useState } from 'react';

type Item = {
  id: string;
  step_key: string;
  step_label: string;
  status: 'todo' | 'in_progress' | 'done';
  notes: string | null;
  due_date: string | null;
  completed_at: string | null;
};

export default function WorkOneChecklist() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  async function seed() {
    await fetch('/api/workone/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
  }

  async function load() {
    setLoading(true);
    
    // Direct DB query for checklist items
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('workone_checklist')
        .select('id, step_key, step_label, status, notes, due_date, completed_at')
        .eq('user_id', user.id)
        .order('created_at');
      
      if (data && data.length > 0) {
        setItems(data);
        setLoading(false);
        return;
      }
    }

    // Fallback to API
    const res = await fetch('/api/workone/list');
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    setItems(json.items || []);
  }

  async function setStatus(id: string, status: Item['status']) {
    const res = await fetch(`/api/workone/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  }

  async function setNotes(id: string, notes: string) {
    await fetch(`/api/workone/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
  }

  useEffect(() => {
    (async () => {
      await seed();
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 mb-4">
        <div className="font-semibold">Your checklist</div>
        <div className="text-sm text-neutral-600 leading-relaxed">
          We are appointment-based for information. Step 1 is to submit the EFH
          inquiry form. Step 2 is to make a WorkOne appointment on
          IndianaCareerConnect and tell them you're there for Elevate for
          Humanity.
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-neutral-500">Loading…</div>
      ) : null}

      <div className="grid gap-3">
        {items.map((it) => (
          <div key={it.id} className="rounded-xl border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{it.step_label}</div>
                <div className="text-xs text-neutral-600 mt-1">
                  Status: <span className="font-semibold">{it.status}</span>
                  {it.completed_at ? ' • Completed' : ''}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStatus(it.id, 'todo')}
                  className="h-8 px-3 rounded-lg border text-xs font-semibold"
                >
                  To do
                </button>
                <button
                  onClick={() => setStatus(it.id, 'in_progress')}
                  className="h-8 px-3 rounded-lg border text-xs font-semibold"
                >
                  In progress
                </button>
                <button
                  onClick={() => setStatus(it.id, 'done')}
                  className="h-8 px-3 rounded-lg bg-black text-white text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-1">
              <div className="text-xs font-semibold text-neutral-700">
                Notes (appointment date/time, advisor name, etc.)
              </div>
              <textarea
                defaultValue={it.notes || ''}
                onBlur={(e) => setNotes(it.id, e.target.value)}
                className="min-h-[60px] rounded-xl border p-2 text-sm leading-relaxed"
                placeholder="Example: Appointment booked for Jan 8 at 10:30am (WorkOne Indy North)…"
              />
              <div className="text-[11px] text-neutral-500">
                Saves on blur (tap outside the box).
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm">
        <a
          className="font-semibold underline"
          href="https://www.indianacareerconnect.com"
          target="_blank"
          rel="noreferrer"
        >
          Go to IndianaCareerConnect to book your WorkOne appointment →
        </a>
      </div>
    </div>
  );
}
