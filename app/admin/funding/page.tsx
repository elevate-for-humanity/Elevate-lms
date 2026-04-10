import { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { DollarSign, CheckCircle, Clock, AlertTriangle, ChevronRight, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'Funding | Admin' };

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-800',
  pending:  'bg-amber-100 text-amber-800',
  expired:  'bg-red-100 text-red-800',
  denied:   'bg-red-100 text-red-800',
};

export default async function FundingPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await getAdminClient();

  const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const [recordsRes, approvedRes, pendingRes, expiringRes] = await Promise.all([
    db.from('funding_records')
      .select('id, source, amount, status, approved_at, expiration_date, student:profiles(full_name, email), program:programs(title)', { count: 'exact' })
      .order('created_at', { ascending: false }).limit(50),
    db.from('funding_records').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    db.from('funding_records').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('funding_records').select('*', { count: 'exact', head: true })
      .lte('expiration_date', soon).gte('expiration_date', new Date().toISOString()),
  ]);

  if (recordsRes.error)   throw new Error(`funding_records query failed: ${recordsRes.error.message}`);
  if (approvedRes.error)  throw new Error(`funding_records approved count failed: ${approvedRes.error.message}`);
  if (pendingRes.error)   throw new Error(`funding_records pending count failed: ${pendingRes.error.message}`);
  if (expiringRes.error)  throw new Error(`funding_records expiring count failed: ${expiringRes.error.message}`);

  const records  = recordsRes.data;
  const total    = recordsRes.count;
  const approved = approvedRes.count;
  const pending  = pendingRes.count;
  const expiring = expiringRes.count;

  const QUICK_LINKS = [
    { label: 'WIOA Participants',    href: '/admin/wioa' },
    { label: 'Grants',               href: '/admin/grants' },
    { label: 'Funding Verification', href: '/admin/funding-verification' },
    { label: 'Payroll',              href: '/admin/payroll' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Funding</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Funding</h1>
        <p className="text-sm text-slate-500 mt-1">Student funding records, WIOA, grants, and payment tracking</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Records',      value: total ?? 0,    icon: DollarSign,    color: 'text-brand-blue-600', bg: 'bg-brand-blue-50',  urgent: false },
            { label: 'Approved',           value: approved ?? 0, icon: CheckCircle,   color: 'text-green-600',      bg: 'bg-green-50',       urgent: false },
            { label: 'Pending',            value: pending ?? 0,  icon: Clock,         color: 'text-amber-600',      bg: 'bg-amber-50',       urgent: (pending ?? 0) > 0 },
            { label: 'Expiring 30 Days',   value: expiring ?? 0, icon: AlertTriangle, color: 'text-rose-600',       bg: 'bg-rose-50',        urgent: (expiring ?? 0) > 0 },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`bg-white rounded-2xl border shadow-sm p-5 ${s.urgent ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'}`}>
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_LINKS.map((l) => (
            <Link key={l.href} href={l.href}
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-between">
              {l.label}
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">Funding Records</h2>
            <span className="text-xs text-slate-400">{total ?? 0} total</span>
          </div>
          {!records?.length ? (
            <div className="py-16 text-center">
              <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No funding records</p>
              <p className="text-xs text-slate-400 mt-1">Records are created when students are approved for WIOA, WRG, or other funding</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Student</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Program</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Source</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {records.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900">{r.student?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{r.student?.email ?? ''}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{r.program?.title ?? '—'}</td>
                      <td className="py-3.5 px-4 text-slate-500">{r.source ?? '—'}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">{r.amount ? `$${Number(r.amount).toLocaleString()}` : '—'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLES[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {r.status ?? 'unknown'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/admin/funding/${r.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700">
                          View <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
