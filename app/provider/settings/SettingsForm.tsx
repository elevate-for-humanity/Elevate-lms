'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';

type Initial = {
  name: string; tagline: string; supportEmail: string; website: string;
  phone: string; addressLine1: string; city: string; state: string; zip: string; logoUrl: string;
};

export default function SettingsForm({
  tenantId, orgId, initial,
}: { tenantId: string; orgId: string | null; initial: Initial }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof Initial, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Organization name is required.'); return; }
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await fetch('/api/provider/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, orgId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Save failed'); return; }
      setSaved(true);
      setTimeout(() => { setSaved(false); router.refresh(); }, 2000);
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  }

  const field = (label: string, key: keyof Initial, opts?: { type?: string; placeholder?: string; required?: boolean }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}{opts?.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        type={opts?.type ?? 'text'}
        placeholder={opts?.placeholder}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
      />
    </div>
  );

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Organization Profile</h2>
        {field('Organization Name', 'name', { required: true, placeholder: 'Acme Training Institute' })}
        {field('Tagline', 'tagline', { placeholder: 'One-line description of your organization' })}
        {field('Support Email', 'supportEmail', { type: 'email', placeholder: 'support@example.org' })}
        {field('Website', 'website', { type: 'url', placeholder: 'https://example.org' })}
        {field('Phone', 'phone', { type: 'tel', placeholder: '(317) 555-0100' })}
        {field('Logo URL', 'logoUrl', { type: 'url', placeholder: 'https://…/logo.png' })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Address</h2>
        {field('Street Address', 'addressLine1', { placeholder: '123 Main St' })}
        <div className="grid grid-cols-3 gap-3">
          {field('City', 'city', { placeholder: 'Indianapolis' })}
          {field('State', 'state', { placeholder: 'IN' })}
          {field('ZIP', 'zip', { placeholder: '46201' })}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : null}
        {saved ? 'Saved' : 'Save Changes'}
      </button>
    </form>
  );
}
