'use client';

import { useState, useTransition } from 'react';
import { Shield, Save, Loader2 } from 'lucide-react';

interface DirectoryField {
  key: string;
  label: string;
  enabled: boolean;
}

interface Props {
  fields: DirectoryField[];
}

export function FerpaDirectoryInfoClient({ fields: initialFields }: Props) {
  const [fields, setFields] = useState(initialFields);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(key: string) {
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)));
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/ferpa/directory-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: Object.fromEntries(fields.map((f) => [f.key, String(f.enabled)])),
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? 'Failed to save settings.');
          return;
        }
        setSaved(true);
      } catch {
        setError('Network error — settings not saved.');
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <Shield className="w-5 h-5 text-slate-500" />
        <h2 className="font-semibold text-slate-900">Directory Information Fields</h2>
      </div>

      <div className="divide-y divide-slate-100">
        {fields.map((field) => (
          <label
            key={field.key}
            className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{field.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {field.enabled
                  ? 'Designated as directory information — may be disclosed without consent'
                  : 'Not designated — requires written consent to disclose'}
              </p>
            </div>
            <div className="relative ml-4 flex-shrink-0">
              <input
                type="checkbox"
                className="sr-only"
                checked={field.enabled}
                onChange={() => toggle(field.key)}
              />
              <div
                className={`w-10 h-6 rounded-full transition-colors ${
                  field.enabled ? 'bg-brand-blue-600' : 'bg-slate-200'
                }`}
              />
              <div
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  field.enabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </label>
        ))}
      </div>

      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
        <div>
          {saved && <p className="text-sm text-emerald-600 font-medium">Settings saved.</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-blue-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
