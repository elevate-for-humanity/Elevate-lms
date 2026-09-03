'use client';

import { useState, useTransition } from 'react';
import { toggleDirectoryField } from './actions';

interface Field {
  key: string;
  label: string;
  description: string;
}

export default function DirectoryInfoClient({
  fields,
  initialSettings,
}: {
  fields: Field[];
  initialSettings: Record<string, boolean>;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);

  function handleToggle(key: string) {
    const newVal = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newVal }));
    startTransition(async () => {
      await toggleDirectoryField(key, newVal);
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
      {fields.map((field) => (
        <div key={field.key} className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="font-medium text-slate-900">{field.label}</p>
            <p className="text-sm text-slate-500 mt-0.5">{field.description}</p>
          </div>
          <div className="flex items-center gap-3">
            {saved === field.key && (
              <span className="text-xs text-green-600 font-medium">Saved</span>
            )}
            <button
              onClick={() => handleToggle(field.key)}
              disabled={isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                settings[field.key] ? 'bg-brand-blue-600' : 'bg-slate-300'
              }`}
              aria-label={`Toggle ${field.label}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  settings[field.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-slate-600 w-16">
              {settings[field.key] ? 'Public' : 'Private'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
