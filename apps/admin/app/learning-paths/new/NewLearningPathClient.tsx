'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, X } from 'lucide-react';

const PATH_TYPES = ['credential', 'career', 'skill', 'general'] as const;
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

type ProgramOption = { id: string; name: string; durationWeeks: number };

export default function NewLearningPathClient({ programs }: { programs: ProgramOption[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    path_type: 'credential' as (typeof PATH_TYPES)[number],
    difficulty: 'beginner' as (typeof DIFFICULTIES)[number],
    estimated_weeks: '',
    is_featured: false,
    programIds: [] as string[],
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!form.programIds.length) {
      setError('Select at least one program');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/learning-paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          estimated_weeks: form.estimated_weeks ? parseInt(form.estimated_weeks) : null,
          programs: form.programIds.map((id) => {
            const program = programs.find((item) => item.id === id);
            return {
              program_id: id,
              name: program?.name ?? '',
              duration_weeks: program?.durationWeeks ?? null,
            };
          }),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      router.push('/learning-paths');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <X className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
        <input
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
          placeholder="Healthcare Career Pathway"
        />
      </div>

      <fieldset>
        <legend className="block text-xs font-medium text-slate-600 mb-2">Programs *</legend>
        <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 p-3 space-y-2">
          {programs.length ? (
            programs.map((program) => (
              <label key={program.id} className="flex items-center gap-3 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={form.programIds.includes(program.id)}
                  onChange={(event) =>
                    set(
                      'programIds',
                      event.target.checked
                        ? [...form.programIds, program.id]
                        : form.programIds.filter((id) => id !== program.id),
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-brand-blue-600"
                />
                <span>{program.name}</span>
              </label>
            ))
          ) : (
            <p className="text-sm text-amber-700">No active programs are available.</p>
          )}
        </div>
      </fieldset>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400 resize-none"
          placeholder="A structured pathway from CNA to Medical Assistant…"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Path Type</label>
          <select
            value={form.path_type}
            onChange={(e) => set('path_type', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
          >
            {PATH_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Difficulty</label>
          <select
            value={form.difficulty}
            onChange={(e) => set('difficulty', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d} className="capitalize">
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Estimated Weeks</label>
          <input
            type="number"
            min="1"
            value={form.estimated_weeks}
            onChange={(e) => set('estimated_weeks', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
            placeholder="12"
          />
        </div>

        <div className="flex items-center gap-3 pt-5">
          <input
            type="checkbox"
            id="featured"
            checked={form.is_featured}
            onChange={(e) => set('is_featured', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-400"
          />
          <label htmlFor="featured" className="text-sm text-slate-700 font-medium">
            Feature on learning paths page
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Create Learning Path'}
        </button>
        <button
          onClick={() => router.push('/learning-paths')}
          className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
