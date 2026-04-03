'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { CheckCircle, Circle, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

type Status = 'todo' | 'in_progress' | 'done';

type Item = {
  id: string;
  step_key: string;
  step_label: string;
  status: Status;
  notes: string | null;
  due_date: string | null;
  completed_at: string | null;
};

const STATUS_CONFIG: Record<Status, { label: string; icon: React.ReactNode; cls: string }> = {
  todo:        { label: 'To do',       icon: <Circle      className="w-5 h-5 text-slate-300" />,   cls: 'bg-slate-50 border-slate-200' },
  in_progress: { label: 'In progress', icon: <Clock       className="w-5 h-5 text-amber-500" />,   cls: 'bg-amber-50 border-amber-200' },
  done:        { label: 'Done',        icon: <CheckCircle className="w-5 h-5 text-emerald-500" />, cls: 'bg-emerald-50 border-emerald-200' },
};

interface Props {
  /** Passed from the page so the component can seed with the right funding source */
  fundingSource?: string;
  /**
   * When true the component seeds checklist rows and renders normally.
   * When false (default) the component renders nothing — prevents seeding
   * checklist rows for learners who are not in pending_workone status.
   */
  pendingWorkone?: boolean;
}

export default function WorkOneChecklist({ fundingSource, pendingWorkone = false }: Props) {
  const [items, setItems]     = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving]   = useState<string | null>(null);
  const supabase = createClient();

  async function seed() {
    // Only seed when the learner is actually in pending_workone status
    if (!pendingWorkone) return;
    await fetch('/api/workone/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fundingSource ? { funding_source: fundingSource } : {}),
    });
  }

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('workone_checklist')
      .select('id,step_key,step_label,status,notes,due_date,completed_at')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    setItems(data ?? []);
    setLoading(false);
  }

  async function setStatus(id: string, status: Status) {
    setSaving(id);
    setItems(prev => prev.map(it => it.id === id ? { ...it, status } : it));
    await fetch(`/api/workone/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setSaving(null);
  }

  async function saveNotes(id: string, notes: string) {
    await fetch(`/api/workone/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
  }

  useEffect(() => {
    (async () => { await seed(); await load(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Don't render for learners who are not in pending_workone status
  if (!pendingWorkone) return null;

  const doneCount = items.filter(i => i.status === 'done').length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900">Your Funding Checklist</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Check off each step as you complete it. Notes save automatically.
          </p>
        </div>
        {!loading && items.length > 0 && (
          <div className="text-right shrink-0">
            <div className="text-sm font-bold text-slate-900">{doneCount}/{items.length}</div>
            <div className="text-xs text-slate-500">steps done</div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {!loading && items.length > 0 && (
        <div className="h-1.5 bg-slate-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {loading && (
        <div className="px-5 py-8 text-sm text-slate-400 text-center">Loading your checklist…</div>
      )}

      {/* Steps */}
      <div className="divide-y divide-slate-100">
        {items.map((item, idx) => {
          const cfg = STATUS_CONFIG[item.status];
          const isOpen = expanded === item.id;

          return (
            <div key={item.id} className={`transition-colors ${item.status === 'done' ? 'bg-emerald-50/40' : ''}`}>
              <div className="px-4 py-3 flex items-start gap-3">
                {/* Step number / status icon */}
                <div className="shrink-0 mt-0.5">
                  {item.status === 'done'
                    ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                    : item.status === 'in_progress'
                    ? <Clock className="w-5 h-5 text-amber-500" />
                    : <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-400">{idx + 1}</span>
                      </div>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug ${item.status === 'done' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    {item.step_label}
                  </p>
                  {item.completed_at && (
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Completed {new Date(item.completed_at).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>

                {/* Status buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {(['todo', 'in_progress', 'done'] as Status[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(item.id, s)}
                      disabled={saving === item.id}
                      className={`text-xs px-2 py-1 rounded-md font-medium transition border ${
                        item.status === s
                          ? s === 'done'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : s === 'in_progress'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-slate-200 text-slate-700 border-slate-200'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}

                  {/* Notes toggle */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : item.id)}
                    className="ml-1 text-slate-400 hover:text-slate-600 transition"
                    aria-label="Toggle notes"
                  >
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Notes panel */}
              {isOpen && (
                <div className="px-4 pb-3 pl-12">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Notes (appointment date, advisor name, authorization code, etc.)
                  </label>
                  <textarea
                    defaultValue={item.notes ?? ''}
                    onBlur={e => saveNotes(item.id, e.target.value)}
                    rows={3}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    placeholder="e.g. Appointment Jan 8 at 10:30am — WorkOne Indy North, ask for Maria. Auth code: WO-2025-XXXXX"
                  />
                  <p className="text-xs text-slate-400 mt-1">Saves when you click outside the box.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <div className="px-5 py-3 border-t bg-slate-50">
        <a
          href="https://www.indianacareerconnect.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-600 hover:text-brand-blue-800 transition"
        >
          Book your WorkOne appointment on IndianaCareerConnect
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
