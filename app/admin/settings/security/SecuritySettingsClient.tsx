'use client';

import { useState } from 'react';
import { Save, CheckCircle, Loader2 } from 'lucide-react';

interface Props {
  initialSettings: Record<string, string>;
}

function Toggle({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-2 ${value ? 'bg-brand-blue-600' : 'bg-slate-200'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

const TOGGLE_FIELDS = [
  { key: 'mfa_required', label: 'Require MFA for Admins', hint: 'Force multi-factor authentication for all admin and super_admin accounts.' },
  { key: 'demo_mode', label: 'Demo Mode', hint: 'Masks real student data with anonymized values for demos and screenshots.' },
  { key: 'demo_allow_in_prod', label: 'Allow Demo Mode in Production', hint: 'Permit demo mode on the live production environment.' },
];

const TEXT_FIELDS = [
  {
    key: 'session_timeout',
    label: 'Session Timeout (minutes)',
    placeholder: '30',
    hint: 'Auto-logout after this many minutes of inactivity. Default: 30.',
    type: 'number',
  },
  {
    key: 'ip_allowlist',
    label: 'Admin IP Allowlist',
    placeholder: '203.0.113.0/24, 198.51.100.5',
    hint: 'Comma-separated IPs or CIDR ranges. Leave blank to allow all. Overrides ADMIN_IP_ALLOWLIST env var.',
    type: 'text',
  },
  {
    key: 'max_login_attempts',
    label: 'Max Login Attempts',
    placeholder: '5',
    hint: 'Lock account after this many failed login attempts.',
    type: 'number',
  },
  {
    key: 'lockout_duration_minutes',
    label: 'Lockout Duration (minutes)',
    placeholder: '15',
    hint: 'How long an account stays locked after too many failed attempts.',
    type: 'number',
  },
];

export function SecuritySettingsClient({ initialSettings }: Props) {
  const [form, setForm] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleValue(key: string): boolean {
    const v = form[key];
    return v === 'true' || v === '1' || v === 'enabled';
  }

  function setToggle(key: string, val: boolean) {
    setForm((f) => ({ ...f, [key]: val ? 'true' : 'false' }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const settings: Record<string, string> = {};
      [...TOGGLE_FIELDS, ...TEXT_FIELDS].forEach(({ key }) => { settings[key] = form[key] ?? ''; });
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
    <div className="max-w-xl space-y-6">
      <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 px-5">
        {TOGGLE_FIELDS.map(({ key, label, hint }) => (
          <Toggle key={key} label={label} hint={hint} value={toggleValue(key)} onChange={(v) => setToggle(key, v)} />
        ))}
      </div>

      <div className="space-y-5">
        {TEXT_FIELDS.map(({ key, label, placeholder, hint, type }) => (
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
      </div>

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
