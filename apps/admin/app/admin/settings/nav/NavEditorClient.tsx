'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_NAV, type NavSection } from '@/lib/admin/nav-config';

export default function NavEditorClient() {
  const [jsonText, setJsonText]   = useState('');
  const [source, setSource]       = useState<'db' | 'default' | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [message, setMessage]     = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);

  const loadNav = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/nav-config');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { sections: NavSection[]; source: 'db' | 'default' } = await res.json();
      setJsonText(JSON.stringify(data.sections, null, 2));
      setSource(data.source);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load nav config.');
      setJsonText(JSON.stringify(DEFAULT_NAV, null, 2));
      setSource('default');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNav(); }, [loadNav]);

  const validate = (): NavSection[] => {
    const parsed: unknown = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) throw new Error('Navigation must be a JSON array of sections.');
    for (const section of parsed as NavSection[]) {
      if (!section.label || !section.href) throw new Error('Each section needs a label and href.');
      if (!Array.isArray(section.items)) throw new Error(`Section "${section.label}" needs an items array.`);
      for (const item of section.items) {
        if (!item.label || !item.href) throw new Error(`Item in "${section.label}" is missing label or href.`);
        if (!item.href.startsWith('/admin')) throw new Error(`href "${item.href}" must start with /admin.`);
      }
    }
    return parsed as NavSection[];
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const sections = validate();
      const res = await fetch('/api/admin/nav-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      setSource('db');
      setMessage('Navigation saved. Reload the page to see the updated nav.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    setJsonText(JSON.stringify(DEFAULT_NAV, null, 2));
    setMessage('Default navigation loaded into editor. Click Save to publish it.');
    setError(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-2xl border bg-white p-6 shadow-sm text-sm text-slate-500">
          Loading navigation config…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Navigation Editor</h1>
            <p className="mt-1 text-sm text-slate-500">
              Edit the JSON that drives the admin top nav. Changes take effect on next page load.
            </p>
          </div>
          {source && (
            <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              source === 'db'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {source === 'db' ? 'Saved in database' : 'Using default (not yet saved)'}
            </span>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save navigation'}
          </button>
          <button
            type="button"
            onClick={resetToDefault}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Load default nav
          </button>
          <button
            type="button"
            onClick={loadNav}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Reload from DB
          </button>
        </div>

        {message && (
          <p className="mt-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          spellCheck={false}
          className="mt-5 min-h-[640px] w-full rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-sm text-slate-100 outline-none focus:ring-2 focus:ring-slate-500 resize-y"
        />

        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">Schema</p>
          <p>Array of sections: <code className="bg-slate-100 px-1 rounded">{'[{ label, href, items: [{ label, href }] }]'}</code></p>
          <p>All <code className="bg-slate-100 px-1 rounded">href</code> values must start with <code className="bg-slate-100 px-1 rounded">/admin</code>.</p>
          <p>Changes are validated server-side before saving. Invalid JSON or bad hrefs will be rejected.</p>
        </div>
      </section>
    </div>
  );
}
