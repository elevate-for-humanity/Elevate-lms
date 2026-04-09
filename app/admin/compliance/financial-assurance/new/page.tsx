'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Shield, Save, Loader2 } from 'lucide-react';

export default function NewFinancialAssurancePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    provider_name: '', policy_number: '', coverage_type: 'surety_bond',
    coverage_amount: '', effective_date: '', expiration_date: '', notes: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/compliance/financial-assurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save');
      router.push('/admin/compliance/financial-assurance');
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Breadcrumbs items={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Financial Assurance', href: '/admin/compliance/financial-assurance' },
        { label: 'New Record' },
      ]} />
      <div className="flex items-center gap-3 mt-6 mb-8">
        <Shield className="w-7 h-7 text-slate-600" />
        <h1 className="text-2xl font-bold text-slate-900">New Financial Assurance Record</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-slate-200 rounded-2xl p-6">
        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}
        {[
          { label: 'Provider / Issuer Name', key: 'provider_name', required: true },
          { label: 'Policy / Bond Number', key: 'policy_number', required: true },
          { label: 'Coverage Amount ($)', key: 'coverage_amount', type: 'number', required: true },
          { label: 'Effective Date', key: 'effective_date', type: 'date', required: true },
          { label: 'Expiration Date', key: 'expiration_date', type: 'date', required: true },
        ].map(({ label, key, type = 'text', required }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}{required && ' *'}</label>
            <input
              type={type} required={required} value={(form as any)[key]}
              onChange={e => set(key, e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Coverage Type *</label>
          <select value={form.coverage_type} onChange={e => set('coverage_type', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
            <option value="surety_bond">Surety Bond</option>
            <option value="liability_insurance">Liability Insurance</option>
            <option value="performance_bond">Performance Bond</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Record'}
          </button>
          <a href="/admin/compliance/financial-assurance" className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-900 font-medium">Cancel</a>
        </div>
      </form>
    </div>
  );
}

