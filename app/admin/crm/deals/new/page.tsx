'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, DollarSign, Save, Loader2 } from 'lucide-react';

export default function NewDealPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    company_name: '',
    value: '',
    stage: 'lead',
    probability: '50',
    expected_close_date: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Deal name is required'); return; }
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          value: parseFloat(form.value) || 0,
          probability: parseInt(form.probability) || 50,
        }),
      });

      if (res.ok) {
        router.push('/admin/crm/deals');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create deal');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'CRM', href: '/admin/crm' }, { label: 'New Deal' }]} />
      </div>
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/crm/deals" className="flex items-center gap-2 text-gray-600 hover:text-brand-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Deals
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">New Deal</h1>
          <p className="text-gray-600">Create a new sales opportunity</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Deal Information</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deal Name *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => update('title', e.target.value)}
                  placeholder="e.g., ABC Corp - Apprenticeship Program"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={e => update('company_name', e.target.value)}
                  placeholder="Company name"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Value ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={form.value}
                      onChange={e => update('value', e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.probability}
                    onChange={e => update('probability', e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stage</label>
                  <select
                    value={form.stage}
                    onChange={e => update('stage', e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  >
                    <option value="lead">Lead</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="closed_won">Closed Won</option>
                    <option value="closed_lost">Closed Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Close Date</label>
                  <input
                    type="date"
                    value={form.expected_close_date}
                    onChange={e => update('expected_close_date', e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={e => update('notes', e.target.value)}
                  placeholder="Add any relevant notes about this deal..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
