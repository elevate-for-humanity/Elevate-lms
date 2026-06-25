'use client';

/**
 * SettingsFormClient — generic editable settings form.
 *
 * Renders a list of fields (toggle, text, select, textarea) backed by
 * platform_settings. Saves via POST /api/admin/platform-settings.
 * Designed to be dropped into any admin settings page.
 */

import React, { useState, useTransition } from 'react';
import { Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export type FieldType = 'toggle' | 'text' | 'number' | 'select' | 'textarea' | 'password';

export interface SettingsField {
  key: string;
  label: string;
  description?: string;
  type: FieldType;
  options?: { value: string; label: string }[]; // for select
  placeholder?: string;
  readonlyNote?: string; // shown below field instead of input
}

interface Props {
  fields: SettingsField[];
  initialValues: Record<string, string>;
  /** If true, only admin can save. Renders a notice for regular admins. */
  superAdminOnly?: boolean;
  isSuperAdmin?: boolean;
}

export default function SettingsFormClient({
  fields,
  initialValues,
  superAdminOnly = false,
  isSuperAdmin = true,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [, startTransition] = useTransition();

  const readonly = superAdminOnly && !isSuperAdmin;

  function set(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setDirty(true);
    setStatus('idle');
  }

  async function handleSave() {
    if (!dirty || readonly) return;
    setStatus('saving');
    try {
      const res = await fetch('/api/admin/platform-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: values }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      setDirty(false);
      setStatus('saved');
      startTransition(() => {
        setTimeout(() => setStatus('idle'), 3000);
      });
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Save failed');
      setStatus('error');
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      {readonly && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <span>These settings require <strong>admin</strong> access to edit.</span>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
        {fields.map((field) => (
          <div key={field.key} className="flex items-start justify-between gap-4 px-5 py-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">{field.label}</p>
              {field.description && (
                <p className="text-xs text-slate-500 mt-0.5">{field.description}</p>
              )}
              {field.readonlyNote && (
                <p className="text-xs text-slate-400 mt-1 italic">{field.readonlyNote}</p>
              )}
            </div>

            <div className="shrink-0 flex items-center">
              {field.type === 'toggle' && (
                <button
                  type="button"
                  disabled={readonly}
                  onClick={() => set(field.key, values[field.key] === 'true' ? 'false' : 'true')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-1 ${
                    values[field.key] === 'true' ? 'bg-brand-blue-600' : 'bg-slate-200'
                  } ${readonly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  aria-checked={values[field.key] === 'true'}
                  role="switch"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      values[field.key] === 'true' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              )}

              {field.type === 'select' && (
                <select
                  value={values[field.key] ?? ''}
                  disabled={readonly}
                  onChange={(e) => set(field.key, e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {field.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              )}

              {(field.type === 'text' || field.type === 'number' || field.type === 'password') && (
                <input
                  type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'}
                  value={values[field.key] ?? ''}
                  disabled={readonly}
                  placeholder={field.placeholder}
                  onChange={(e) => set(field.key, e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 w-48 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  value={values[field.key] ?? ''}
                  disabled={readonly}
                  placeholder={field.placeholder}
                  rows={3}
                  onChange={(e) => set(field.key, e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 w-48 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Save bar */}
      {!readonly && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!dirty || status === 'saving'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
          >
            {status === 'saving' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {status === 'saving' ? 'Saving…' : 'Save Changes'}
          </button>

          {status === 'saved' && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle className="w-4 h-4" /> Saved
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-1.5 text-sm text-red-500">
              <AlertCircle className="w-4 h-4" /> {errorMsg}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
