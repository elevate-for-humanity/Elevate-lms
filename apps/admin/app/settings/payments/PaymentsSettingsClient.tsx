'use client';

import { useState } from 'react';
import { Save, CheckCircle, Loader2 } from 'lucide-react';

interface Props {
  initialSettings: Record<string, string>;
}

const SELECT_FIELDS = [
  {
    key: 'stripe_mode',
    label: 'Stripe Mode',
    hint: 'Switch between live and test payment processing.',
    options: [
      { value: 'live', label: 'Live — real payments' },
      { value: 'test', label: 'Test — Stripe test mode' },
    ],
  },
  {
    key: 'currency',
    label: 'Default Currency',
    hint: 'Currency used for all transactions.',
    options: [
      { value: 'usd', label: 'USD — US Dollar' },
      { value: 'cad', label: 'CAD — Canadian Dollar' },
    ],
  },
];

const TOGGLE_FIELDS = [
  { key: 'bnpl_enabled', label: 'BNPL Enabled', hint: 'Allow Affirm, Sezzle, Klarna, and other BNPL providers at checkout.' },
  { key: 'affirm_enabled', label: 'Affirm', hint: 'Enable Affirm monthly installment financing.' },
  { key: 'sezzle_enabled', label: 'Sezzle', hint: 'Enable Sezzle 4-payment interest-free option.' },
  { key: 'klarna_enabled', label: 'Klarna', hint: 'Enable Klarna via Stripe.' },
  { key: 'afterpay_enabled', label: 'Afterpay', hint: 'Enable Afterpay via Stripe.' },
  { key: 'payment_plans_enabled', label: 'Payment Plans', hint: 'Allow students to set up custom weekly payment plans.' },
];

const TEXT_FIELDS = [
  { key: 'stripe_webhook_endpoint', label: 'Stripe Webhook Endpoint', placeholder: 'https://www.elevateforhumanity.org/api/webhooks/stripe', hint: 'Registered in Stripe Dashboard → Webhooks.', type: 'url' },
  { key: 'payment_success_url', label: 'Payment Success URL', placeholder: 'https://www.elevateforhumanity.org/enroll/success', hint: 'Redirect after successful checkout.', type: 'url' },
  { key: 'payment_cancel_url', label: 'Payment Cancel URL', placeholder: 'https://www.elevateforhumanity.org/enroll', hint: 'Redirect when checkout is abandoned.', type: 'url' },
];

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

export function PaymentsSettingsClient({ initialSettings }: Props) {
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
      [...SELECT_FIELDS, ...TOGGLE_FIELDS, ...TEXT_FIELDS].forEach(({ key }) => { settings[key] = form[key] ?? ''; });
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
      {/* Selects */}
      <div className="space-y-5">
        {SELECT_FIELDS.map(({ key, label, hint, options }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <select
              value={form[key] ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            >
              <option value="">— Select —</option>
              {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
          </div>
        ))}
      </div>

      {/* BNPL toggles */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Payment Methods</p>
        <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 px-5">
          {TOGGLE_FIELDS.map(({ key, label, hint }) => (
            <Toggle key={key} label={label} hint={hint} value={toggleValue(key)} onChange={(v) => setToggle(key, v)} />
          ))}
        </div>
      </div>

      {/* URL fields */}
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

      <p className="text-xs text-slate-400">
        Stripe API keys are managed in Dev Studio → Secrets. Keys are never stored in platform_settings.
      </p>

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
