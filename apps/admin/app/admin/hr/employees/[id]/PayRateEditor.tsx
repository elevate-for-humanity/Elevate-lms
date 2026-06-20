'use client';

import { useState } from 'react';
import { DollarSign, Save, Loader2, CheckCircle2, History, CreditCard } from 'lucide-react';

interface PayRateHistory {
  rate: number | null;
  payment_type: string | null;
  effective_date: string;
  notes: string | null;
  created_at: string;
}

interface Props {
  employeeId: string;
  currentRate: number | null;
  paymentType: string | null;
  payoutMethod: string | null;
  payrollProvider: string | null;
  w9OnFile: boolean;
  history: PayRateHistory[];
}

const PAYMENT_TYPES = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'salary', label: 'Salary (annual)' },
  { value: 'contractor', label: 'Contractor (per project)' },
];

const PAYOUT_METHODS = [
  { value: 'direct_deposit', label: 'Direct Deposit (ACH)' },
  { value: 'payroll_card', label: 'Payroll Card' },
  { value: 'check', label: 'Paper Check' },
  { value: 'zelle', label: 'Zelle' },
];

const PAYROLL_PROVIDERS = [
  'QuickBooks Payroll',
  'Gusto',
  'ADP',
  'Paychex',
  'Elevate In-House',
  'Other',
];

function fmt(n: number | null, type: string | null) {
  if (n == null) return '—';
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  if (type === 'hourly') return `${formatted}/hr`;
  if (type === 'salary') return `${formatted}/yr`;
  return formatted;
}

export default function PayRateEditor({
  employeeId,
  currentRate: initialRate,
  paymentType: initialType,
  payoutMethod: initialPayout,
  payrollProvider: initialProvider,
  w9OnFile,
  history: initialHistory,
}: Props) {
  const [rate, setRate] = useState(initialRate?.toString() ?? '');
  const [paymentType, setPaymentType] = useState(initialType ?? 'hourly');
  const [payoutMethod, setPayoutMethod] = useState(initialPayout ?? 'direct_deposit');
  const [payrollProvider, setPayrollProvider] = useState(initialProvider ?? 'Elevate In-House');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<PayRateHistory[]>(initialHistory);
  const [showHistory, setShowHistory] = useState(false);

  async function save() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/hr/employees/${employeeId}/pay-rate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rate: rate ? parseFloat(rate) : undefined,
          payment_type: paymentType,
          payout_method: payoutMethod,
          payroll_provider: payrollProvider,
          effective_date: effectiveDate,
          notes: notes || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? 'Save failed'); return; }
      setSaved(true);
      // Refresh history
      const hr = await fetch(`/api/admin/hr/employees/${employeeId}/pay-rate`);
      if (hr.ok) {
        const hd = await hr.json();
        setHistory(hd.history ?? []);
      }
      setTimeout(() => setSaved(false), 3000);
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          <h3 className="font-semibold text-slate-900">Pay Rate &amp; Payroll</h3>
        </div>
        <div className="flex items-center gap-3">
          {!w9OnFile && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
              W-9 not on file
            </span>
          )}
          {w9OnFile && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> W-9 on file
            </span>
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <History className="w-3.5 h-3.5" />
            History
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Current rate display */}
        <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <DollarSign className="w-8 h-8 text-green-600 shrink-0" />
          <div>
            <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Current Rate</p>
            <p className="text-2xl font-bold text-green-800">
              {fmt(initialRate, initialType)}
            </p>
            {initialPayout && (
              <p className="text-xs text-green-600 mt-0.5">
                via {PAYOUT_METHODS.find(m => m.value === initialPayout)?.label ?? initialPayout}
                {initialProvider && ` · ${initialProvider}`}
              </p>
            )}
          </div>
        </div>

        {/* Edit form */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Payment Type
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
            >
              {PAYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Rate {paymentType === 'hourly' ? '($/hr)' : paymentType === 'salary' ? '($/yr)' : '($)'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder={paymentType === 'salary' ? '45000' : '18.50'}
                className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Payout Method
            </label>
            <select
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
            >
              {PAYOUT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Payroll Provider
            </label>
            <select
              value={payrollProvider}
              onChange={(e) => setPayrollProvider(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
            >
              {PAYROLL_PROVIDERS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Effective Date
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Annual raise, promotion"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Pay Rate'}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </span>
          )}
        </div>

        {/* Pay rate history */}
        {showHistory && history.length > 0 && (
          <div className="mt-2 border border-slate-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Pay Rate History</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Effective', 'Rate', 'Type', 'Notes'].map((h) => (
                    <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                      {new Date(h.effective_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">{fmt(h.rate, h.payment_type)}</td>
                    <td className="px-4 py-2.5 text-slate-500 capitalize">{h.payment_type ?? '—'}</td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{h.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {showHistory && history.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-3">No pay rate history yet.</p>
        )}
      </div>
    </div>
  );
}
