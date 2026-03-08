'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  DollarSign, Users, Calendar, Play, CheckCircle,
  Clock, AlertCircle, Download, ChevronRight, X
} from 'lucide-react';

interface PayrollRun {
  id: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  status: string;
  total_gross: number | null;
  total_net: number | null;
  total_taxes: number | null;
  employee_count: number | null;
  created_at: string;
}

interface Props {
  staffCount: number;
  payrollRuns: PayrollRun[];
}

function fmt(n: number | null) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    processing: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-brand-blue-100 text-brand-blue-800',
    paid: 'bg-brand-green-100 text-brand-green-800',
    failed: 'bg-red-100 text-red-800',
  };
  return map[status] ?? 'bg-slate-100 text-slate-600';
}

export default function PayrollClient({ staffCount, payrollRuns: initial }: Props) {
  const [runs, setRuns] = useState<PayrollRun[]>(initial);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Default to current bi-weekly period
  const today = new Date();
  const periodStart = new Date(today);
  periodStart.setDate(today.getDate() - 14);
  const payDate = new Date(today);
  payDate.setDate(today.getDate() + 3);

  const [form, setForm] = useState({
    pay_period_start: periodStart.toISOString().split('T')[0],
    pay_period_end: today.toISOString().split('T')[0],
    pay_date: payDate.toISOString().split('T')[0],
  });

  const ytd = runs.reduce((s, r) => s + (r.total_gross ?? 0), 0);
  const lastRun = runs[0];

  async function runPayroll() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/hr/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run payroll');
      setRuns([data.payrollRun, ...runs]);
      setSuccess(`Payroll run created — ${data.summary?.employeeCount ?? 0} employees processed.`);
      setShowModal(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <nav className="text-sm mb-2 text-slate-500">
            <Link href="/admin" className="hover:text-brand-blue-600">Admin</Link>
            {' / '}
            <Link href="/admin/hr" className="hover:text-brand-blue-600">HR</Link>
            {' / '}
            <span className="text-slate-900 font-medium">Payroll</span>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900">Payroll Management</h1>
          <p className="text-slate-500 mt-1">Process payroll runs and manage pay stubs</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-brand-blue-700 font-semibold transition"
        >
          <Play className="w-4 h-4" />
          Run Payroll
        </button>
      </div>

      {success && (
        <div className="mb-6 flex items-center gap-3 bg-brand-green-50 border border-brand-green-200 text-brand-green-800 rounded-lg px-4 py-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Last Run Gross</p>
          <p className="text-2xl font-bold text-brand-green-600">{fmt(lastRun?.total_gross ?? null)}</p>
          {lastRun && <p className="text-xs text-slate-400 mt-1">{fmtDate(lastRun.pay_date)}</p>}
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">YTD Total</p>
          <p className="text-2xl font-bold text-brand-blue-600">{fmt(ytd)}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Staff Accounts</p>
          <p className="text-2xl font-bold text-brand-blue-600">{staffCount}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Next Pay Date</p>
          <p className="text-lg font-bold text-slate-900">{fmtDate(form.pay_date)}</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Employees', href: '/admin/hr/employees', icon: Users },
          { label: 'Time & Attendance', href: '/admin/hr/time', icon: Clock },
          { label: 'Payroll Cards', href: '/admin/payroll-cards', icon: DollarSign },
          { label: 'Leave Management', href: '/admin/hr/leave', icon: Calendar },
        ].map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 bg-white border rounded-xl px-4 py-3 hover:border-brand-blue-300 hover:bg-brand-blue-50 transition group">
            <Icon className="w-5 h-5 text-brand-blue-500 group-hover:text-brand-blue-700" />
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
          </Link>
        ))}
      </div>

      {/* Payroll history */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Payroll History</h2>
          <Link href="/api/payroll/export" className="flex items-center gap-1.5 text-sm text-brand-blue-600 hover:underline">
            <Download className="w-4 h-4" /> Export
          </Link>
        </div>
        {runs.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No payroll runs yet. Click <strong>Run Payroll</strong> to get started.</p>
          </div>
        ) : (
          <div className="divide-y">
            {runs.map((run) => (
              <div key={run.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge(run.status)}`}>
                      {run.status}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {fmtDate(run.pay_period_start)} – {fmtDate(run.pay_period_end)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Pay date: {fmtDate(run.pay_date)} · {run.employee_count ?? 0} employees</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Gross</p>
                    <p className="font-semibold text-slate-900">{fmt(run.total_gross)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Taxes</p>
                    <p className="font-semibold text-slate-700">{fmt(run.total_taxes)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Net</p>
                    <p className="font-semibold text-brand-green-700">{fmt(run.total_net)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Run Payroll Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-slate-900">Run Payroll</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pay Period Start</label>
                <input type="date" value={form.pay_period_start}
                  onChange={e => setForm(f => ({ ...f, pay_period_start: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pay Period End</label>
                <input type="date" value={form.pay_period_end}
                  onChange={e => setForm(f => ({ ...f, pay_period_end: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pay Date</label>
                <input type="date" value={form.pay_date}
                  onChange={e => setForm(f => ({ ...f, pay_date: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}
              <div className="bg-slate-50 rounded-lg px-4 py-3 text-xs text-slate-500">
                This will calculate gross pay, taxes, and net pay for all active employees with approved time entries in the selected period.
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border rounded-lg hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={runPayroll} disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50">
                {submitting ? <><Clock className="w-4 h-4 animate-spin" /> Processing…</> : <><Play className="w-4 h-4" /> Run Payroll</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
