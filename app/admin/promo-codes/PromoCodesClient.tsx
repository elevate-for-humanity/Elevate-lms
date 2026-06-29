'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Check, X, Tag, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  current_uses: number;
  valid_until: string | null;
  is_active: boolean;
  applies_to: string;
  created_at: string;
}

const EMPTY: Omit<PromoCode, 'id' | 'current_uses' | 'created_at'> = {
  code: '', description: '', discount_type: 'percentage', discount_value: 10,
  min_purchase: 0, max_uses: null, valid_until: null, is_active: true, applies_to: 'all',
};

export default function PromoCodesClient() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promo-codes');
      const data = await res.json();
      setCodes(data.promoCodes ?? []);
    } catch { setError('Failed to load promo codes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startNew = () => { setForm(EMPTY); setEditId('new'); setError(null); };
  const startEdit = (c: PromoCode) => {
    setForm({ code: c.code, description: c.description ?? '', discount_type: c.discount_type,
      discount_value: c.discount_value, min_purchase: c.min_purchase, max_uses: c.max_uses,
      valid_until: c.valid_until ? c.valid_until.slice(0, 10) : null,
      is_active: c.is_active, applies_to: c.applies_to });
    setEditId(c.id);
    setError(null);
  };
  const cancel = () => { setEditId(null); setError(null); };

  const save = async () => {
    if (!form.code.trim()) { setError('Code is required'); return; }
    setSaving(true); setError(null);
    try {
      const method = editId === 'new' ? 'POST' : 'PUT';
      const body = editId === 'new' ? form : { ...form, id: editId };
      const res = await fetch('/api/admin/promo-codes', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Save failed'); }
      await load(); setEditId(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  };

  const del = async (id: string, code: string) => {
    if (!confirm(`Delete promo code "${code}"?`)) return;
    try {
      const res = await fetch(`/api/admin/promo-codes?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Delete failed'); }
  };

  const toggle = async (c: PromoCode) => {
    try {
      await fetch('/api/admin/promo-codes', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, is_active: !c.is_active }),
      });
      await load();
    } catch { setError('Toggle failed'); }
  };

  const fmtDiscount = (c: PromoCode) =>
    c.discount_type === 'percentage' ? `${c.discount_value}%` : `$${c.discount_value}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promo Codes</h1>
          <p className="text-sm text-slate-500 mt-1">Discount codes for enrollment and course purchases</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={startNew} className="flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> New Code
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* New / Edit form */}
      {editId !== null && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-800">{editId === 'new' ? 'New Promo Code' : 'Edit Promo Code'}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Code *</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
                placeholder="SUMMER25" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <input value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
                placeholder="Summer 2025 discount" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Discount Type</label>
              <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as 'percentage' | 'fixed' }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Discount Value {form.discount_type === 'percentage' ? '(%)' : '($)'}
              </label>
              <input type="number" min="0" value={form.discount_value}
                onChange={e => setForm(f => ({ ...f, discount_value: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Min Purchase ($)</label>
              <input type="number" min="0" value={form.min_purchase}
                onChange={e => setForm(f => ({ ...f, min_purchase: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Max Uses (blank = unlimited)</label>
              <input type="number" min="1" value={form.max_uses ?? ''}
                onChange={e => setForm(f => ({ ...f, max_uses: e.target.value ? parseInt(e.target.value) : null }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
                placeholder="Unlimited" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Valid Until</label>
              <input type="date" value={form.valid_until ?? ''}
                onChange={e => setForm(f => ({ ...f, valid_until: e.target.value || null }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Applies To</label>
              <select value={form.applies_to} onChange={e => setForm(f => ({ ...f, applies_to: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400">
                <option value="all">All programs</option>
                <option value="career_courses">Career courses only</option>
                <option value="specific">Specific courses</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <Check className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={cancel} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading…</div>
      ) : codes.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <Tag className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No promo codes yet</p>
          <p className="text-slate-400 text-sm mt-1">Create your first discount code above</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Code', 'Discount', 'Uses', 'Valid Until', 'Applies To', 'Status', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {codes.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-slate-800">{c.code}</span>
                    {c.description && <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-brand-blue-700">{fmtDiscount(c)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.current_uses}{c.max_uses ? ` / ${c.max_uses}` : ''}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.valid_until ? new Date(c.valid_until).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{c.applies_to.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(c)} className="flex items-center gap-1.5 text-xs font-medium">
                      {c.is_active
                        ? <><ToggleRight className="w-4 h-4 text-green-500" /><span className="text-green-700">Active</span></>
                        : <><ToggleLeft className="w-4 h-4 text-slate-400" /><span className="text-slate-500">Inactive</span></>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => startEdit(c)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => del(c.id, c.code)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
