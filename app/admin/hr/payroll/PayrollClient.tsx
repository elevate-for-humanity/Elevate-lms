'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Users,
  Calendar,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  ChevronRight,
  X,
  ExternalLink,
  FileText,
  CreditCard,
  Banknote,
  ShieldCheck,
} from 'lucide-react';

// ── Canonical resource links ──────────────────────────────────────────────────
const RESOURCES = [
  {
    category: 'Payroll Forms',
    icon: FileText,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    items: [
      {
        label: 'IRS Form W-9 — Request for Taxpayer ID (contractors)',
        url: 'https://www.irs.gov/pub/irs-pdf/fw9.pdf',
        desc: 'Required before first payment to any contractor or vendor',
      },
      {
        label: 'I-9 — Employment Eligibility Verification',
        url: 'https://www.uscis.gov/sites/default/files/document/forms/i-9.pdf',
        desc: 'Required for all new employees within 3 days of hire',
      },
      {
        label: 'Federal withholding & 1099 forms',
        url: '/contact',
        desc: 'Contact HR for W-4, W-4P, and year-end contractor reporting forms',
      },
    ],
  },
  {
    category: 'Direct Deposit',
    icon: Banknote,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    items: [
      {
        label: 'SF-1199A — Direct Deposit Sign-Up Form (US Treasury)',
        url: 'https://www.fiscal.treasury.gov/files/forms/sf-1199a.pdf',
        desc: 'Standard federal direct deposit authorization form',
      },
      {
        label: 'QuickBooks Payroll — Set Up Direct Deposit',
        url: 'https://quickbooks.intuit.com/learn-support/en-us/help-article/direct-deposit/set-direct-deposit-employees-quickbooks-online/L9GKtFBBH',
        desc: 'Step-by-step guide to enable direct deposit in QuickBooks',
      },
      {
        label: 'QuickBooks Payroll — Sign Up',
        url: 'https://quickbooks.intuit.com/payroll/',
        desc: 'Full-service payroll with automatic tax filing',
      },
      {
        label: 'Gusto Payroll — Direct Deposit Setup',
        url: 'https://gusto.com/product/payroll/direct-deposit',
        desc: 'Alternative payroll provider with same-day direct deposit',
      },
    ],
  },
  {
    category: 'Payroll Cards & Virtual Debit Cards',
    icon: CreditCard,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    items: [
      {
        label: 'Stripe Issuing — Virtual & Physical Cards',
        url: 'https://dashboard.stripe.com/issuing/overview',
        desc: 'Issue virtual debit cards instantly. Enable Issuing on your Stripe account first.',
        badge: 'Needs activation',
      },
      {
        label: 'QuickBooks Money — Payroll Debit Card',
        url: 'https://quickbooks.intuit.com/money/',
        desc: 'Employees get a Visa debit card funded on payday — no bank account needed',
      },
      {
        label: 'Ramp — Virtual Corporate Cards',
        url: 'https://ramp.com/virtual-cards',
        desc: 'Instant virtual cards for vendors and contractors with spend controls',
      },
      {
        label: 'Brex — Corporate Cards',
        url: 'https://www.brex.com/product/corporate-card',
        desc: 'Virtual and physical cards with real-time expense tracking',
      },
      {
        label: 'Gusto Cashout — Earned Wage Access',
        url: 'https://gusto.com/product/employee-benefits/cashout',
        desc: 'Employees access earned wages before payday — no cost to employer',
      },
    ],
  },
  {
    category: 'Compliance & Onboarding',
    icon: ShieldCheck,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    items: [
      {
        label: 'Indiana New Hire Reporting',
        url: 'https://www.in.gov/dwd/new-hire-reporting/',
        desc: 'Required within 20 days of hire for all Indiana employers',
      },
      {
        label: 'Indiana Dept of Revenue — Withholding',
        url: 'https://www.in.gov/dor/business-tax/withholding-income-tax/',
        desc: 'State income tax withholding registration and filing',
      },
      {
        label: 'EFTPS — Federal Tax Deposits',
        url: 'https://www.eftps.gov/eftps/',
        desc: 'Electronic Federal Tax Payment System — required for payroll tax deposits',
      },
    ],
  },
];

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

interface W9Submission {
  id: string;
  legal_name: string | null;
  ein: string | null;
  file_url: string;
  submitted_at: string;
  verified: boolean;
  provider_app_id: string | null;
}

interface Props {
  staffCount: number;
  payrollRuns: PayrollRun[];
  w9Queue?: W9Submission[];
  pendingW9Count?: number;
}

function fmt(n: number | null) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

export default function PayrollClient({ staffCount, payrollRuns: initial, w9Queue = [], pendingW9Count = 0 }: Props) {
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
      const res = await fetch('/api/admin/payouts/mark-paid', {
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
            <Link href="/admin" className="hover:text-brand-blue-600">
              Admin
            </Link>
            {' / '}
            <Link href="/admin/hr" className="hover:text-brand-blue-600">
              HR
            </Link>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
            Last Run Gross
          </p>
          <p className="text-2xl font-bold text-brand-green-600">
            {fmt(lastRun?.total_gross ?? null)}
          </p>
          {lastRun && <p className="text-xs text-slate-400 mt-1">{fmtDate(lastRun.pay_date)}</p>}
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
            YTD Total
          </p>
          <p className="text-2xl font-bold text-brand-blue-600">{fmt(ytd)}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
            Staff Accounts
          </p>
          <p className="text-2xl font-bold text-brand-blue-600">{staffCount}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
            Next Pay Date
          </p>
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
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 bg-white border rounded-xl px-4 py-3 hover:border-brand-blue-300 hover:bg-brand-blue-50 transition group"
          >
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
          <Link
            href="/api/payroll/export"
            className="flex items-center gap-1.5 text-sm text-brand-blue-600 hover:underline"
          >
            <Download className="w-4 h-4" /> Export
          </Link>
        </div>
        {runs.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>
              No payroll runs yet. Click <strong>Run Payroll</strong> to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {runs.map((run) => (
              <div
                key={run.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge(run.status)}`}
                    >
                      {run.status}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {fmtDate(run.pay_period_start)} – {fmtDate(run.pay_period_end)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Pay date: {fmtDate(run.pay_date)} · {run.employee_count ?? 0} employees
                  </p>
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

      {/* W9 Queue */}
      {(w9Queue.length > 0 || pendingW9Count > 0) && (
        <div className="mb-8 bg-white rounded-xl border border-amber-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-100 flex items-center justify-between bg-amber-50">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <h2 className="font-semibold text-slate-900">W-9 Queue</h2>
              {pendingW9Count > 0 && (
                <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-semibold">
                  {pendingW9Count} pending
                </span>
              )}
            </div>
            <Link href="/admin/provider-applications" className="text-xs text-amber-700 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {w9Queue.length === 0 ? (
            <p className="px-5 py-4 text-sm text-slate-400">No unverified W-9s in queue.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {w9Queue.map((w9) => (
                <div key={w9.id} className="flex items-center justify-between px-5 py-3 gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {w9.legal_name ?? 'Unknown'}
                    </p>
                    {w9.ein && <p className="text-xs text-slate-400 font-mono">EIN: {w9.ein}</p>}
                    <p className="text-xs text-slate-400">
                      Submitted {new Date(w9.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={w9.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-brand-blue-600 hover:underline"
                    >
                      View W-9 <ExternalLink className="w-3 h-3" />
                    </a>
                    {!w9.verified && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Unverified
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Forms, Direct Deposit & Virtual Cards */}
      <div className="mb-8 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Forms, Direct Deposit &amp; Payroll Cards</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {RESOURCES.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.category} className={`bg-white rounded-xl border ${section.border} overflow-hidden`}>
                <div className={`px-4 py-3 ${section.bg} border-b ${section.border} flex items-center gap-2`}>
                  <Icon className={`w-4 h-4 ${section.color}`} />
                  <h3 className="text-sm font-semibold text-slate-800">{section.category}</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {section.items.map((item) => (
                    <a
                      key={item.url}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-slate-50 transition group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 group-hover:text-brand-blue-700 flex items-center gap-1.5">
                          {item.label}
                          {'badge' in item && item.badge && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-normal">
                              {item.badge}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-blue-500 shrink-0 mt-0.5" />
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Run Payroll Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-slate-900">Run Payroll</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Pay Period Start
                </label>
                <input
                  type="date"
                  value={form.pay_period_start}
                  onChange={(e) => setForm((f) => ({ ...f, pay_period_start: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Pay Period End
                </label>
                <input
                  type="date"
                  value={form.pay_period_end}
                  onChange={(e) => setForm((f) => ({ ...f, pay_period_end: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pay Date</label>
                <input
                  type="date"
                  value={form.pay_date}
                  onChange={(e) => setForm((f) => ({ ...f, pay_date: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}
              <div className="bg-slate-50 rounded-lg px-4 py-3 text-xs text-slate-500">
                This will calculate gross pay, taxes, and net pay for all active employees with
                approved time entries in the selected period.
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={runPayroll}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Run Payroll
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
