'use client';

import { useState } from 'react';
import { Save, CheckCircle, Loader2 } from 'lucide-react';

interface Props {
  initialSettings: Record<string, string>;
}

const FIELDS = [
  {
    key: 'email_from_name',
    label: 'From Name',
    placeholder: 'Elevate for Humanity',
    hint: 'Display name shown on all outbound emails.',
    type: 'text',
  },
  {
    key: 'email_from_address',
    label: 'From Address',
    placeholder: 'noreply@elevateforhumanity.org',
    hint: 'Sender email address. Must be verified in your email provider.',
    type: 'email',
  },
  {
    key: 'reply_to_email',
    label: 'Reply-To Address',
    placeholder: 'info@elevateforhumanity.org',
    hint: 'Where replies are directed. Leave blank to use From Address.',
    type: 'email',
  },
  {
    key: 'email_provider',
    label: 'Email Provider',
    placeholder: 'resend',
    hint: 'Active delivery service: resend, sendgrid, or smtp.',
    type: 'text',
  },
  {
    key: 'mou_archive_email',
    label: 'MOU Archive Email',
    placeholder: 'agreements@elevateforhumanity.org',
    hint: 'BCC address for all signed MOU documents.',
    type: 'email',
  },
  {
    key: 'sponsor_finance_email',
    label: 'Finance / Sponsor Email',
    placeholder: 'accounting@elevateforhumanity.org',
    hint: 'Receives payment confirmations and sponsor invoices.',
    type: 'email',
  },
];

export function EmailSettingsClient({ initialSettings }: Props) {
  const [form, setForm] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const settings: Record<string, string> = {};
      FIELDS.forEach(({ key }) => { settings[key] = form[key] ?? ''; });
      const res = await fetch('/api/admin/platform-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as any).error ?? 'Save failed');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-5">
      {FIELDS.map(({ key, label, placeholder, hint, type }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
          <input
            type={type}
            value={form[key] ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            placeholder={placeholder}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
          />
          {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
        </div>
      ))}

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved' : 'Save Changes'}
      </button>
    </div>
  );
}
