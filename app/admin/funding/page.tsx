import { Metadata } from 'next';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import { logger } from '@/lib/logger';
import Link from 'next/link';
import {
  DollarSign, CheckCircle, Clock, AlertTriangle,
  ChevronRight, ArrowRight, FileText, Mail,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Funding | Admin' };

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-800',
  pending:  'bg-amber-100 text-amber-800',
  invoiced: 'bg-blue-100 text-blue-800',
  paid:     'bg-green-100 text-green-800',
  expired:  'bg-red-100 text-red-800',
  denied:   'bg-red-100 text-red-800',
};

const WIOA_TYPE_STYLES: Record<string, string> = {
  'Dislocated Worker': 'bg-purple-100 text-purple-800',
  'Adult':             'bg-blue-100 text-blue-800',
  'Youth':             'bg-teal-100 text-teal-800',
};

export default async function FundingPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();

  const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [vouchersRes, approvedRes, pendingRes, expiringRes, enrollmentsRes] = await Promise.all([
    db.from('ita_vouchers')
      .select(
        'id, voucher_id, participant_name, wioa_type, fund_stream, service_name, ' +
        'voucher_date, voucher_expire_date, total_voucher_amount, payments_to_date, ' +
        'status, is_final, remittance_email',
      )
      .count('exact')
      .order('voucher_date', { ascending: false })
      .limit(100) as any,
    db.from('ita_vouchers').select('id', { count: 'exact', head: true }).eq('status', 'approved') as any,
    db.from('ita_vouchers').select('id', { count: 'exact', head: true }).eq('status', 'pending') as any,
    db.from('ita_vouchers').select('id', { count: 'exact', head: true })
      .eq('status', 'approved').lte('voucher_expire_date', soon) as any,
    // All enrolled students with payment data
    db.from('program_enrollments')
      .select('id, user_id, full_name, email, program_slug, payment_status, amount_paid_cents, funding_source, payout_status, payout_amount, payout_due_date, access_granted_at, enrolled_at')
      .in('status', ['active', 'enrolled', 'in_progress'])
      .order('enrolled_at', { ascending: false })
      .limit(200),
  ]);

  if (vouchersRes.error) logger.error('[Funding] ita_vouchers query failed', vouchersRes.error);

  const vouchers  = vouchersRes.data ?? [];
  const total     = vouchersRes.count ?? 0;
  const approved  = approvedRes.count ?? 0;
  const pending   = pendingRes.count ?? 0;
  const expiring  = expiringRes.count ?? 0;

  const totalAuthorized  = vouchers.reduce((s, v) => s + Number(v.total_voucher_amount ?? 0), 0);
  const totalPaid        = vouchers.reduce((s, v) => s + Number(v.payments_to_date ?? 0), 0);
  const totalOutstanding = totalAuthorized - totalPaid;

  // Student payments — hydrate names from profiles where full_name missing on enrollment
  const enrollments = enrollmentsRes.data ?? [];
  const missingNameIds = enrollments.filter(e => !e.full_name).map(e => e.user_id).filter(Boolean);
  const profileMap: Record<string, string> = {};
  if (missingNameIds.length) {
    const { data: profiles } = await db.from('profiles').select('id, full_name, email').in('id', missingNameIds);
    (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p.full_name || p.email; });
  }
  const studentPayments = enrollments.map((e: any) => ({
    ...e,
    display_name: e.full_name || profileMap[e.user_id] || e.email || 'Unknown',
  }));

  const selfPayStudents = studentPayments.filter((e: any) => e.funding_source !== 'wioa');
  const totalSelfPay = selfPayStudents.reduce((s: number, e: any) => s + (e.amount_paid_cents ?? 0), 0);

  const QUICK_LINKS = [
    { label: 'WIOA Participants',    href: '/admin/wioa' },
    { label: 'Grants',               href: '/admin/grants' },
    { label: 'Funding Verification', href: '/admin/funding-verification' },
    { label: 'Payroll',              href: '/admin/hr/payroll' },
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
        <p className="text-sm text-slate-500 mt-1">ITA vouchers, WIOA funding, and payment tracking</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Vouchers',    value: total,    icon: FileText,      color: 'text-brand-blue-600', bg: 'bg-brand-blue-50', urgent: false },
            { label: 'Approved',          value: approved, icon: CheckCircle,   color: 'text-green-600',      bg: 'bg-green-50',      urgent: false },
            { label: 'Pending',           value: pending,  icon: Clock,         color: 'text-amber-600',      bg: 'bg-amber-50',      urgent: pending > 0 },
            { label: 'Expiring ≤30 Days', value: expiring, icon: AlertTriangle, color: 'text-rose-600',       bg: 'bg-rose-50',       urgent: expiring > 0 },
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

        {/* Financial summary */}
        {total > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Authorized', value: totalAuthorized,  color: 'text-slate-900' },
              { label: 'Paid to Date',     value: totalPaid,        color: 'text-green-700' },
              { label: 'Outstanding',      value: totalOutstanding, color: 'text-amber-700' },
            ].map((s) => (
              <div key={s.label} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-500 font-medium mb-1">{s.label}</p>
                <p className={`text-xl font-black tabular-nums ${s.color}`}>
                  ${s.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        )}

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

        {/* ITA Vouchers table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">ITA Vouchers</h2>
              <p className="text-xs text-slate-400 mt-0.5">WorkOne / EmployIndy WIOA training vouchers</p>
            </div>
            <span className="text-xs text-slate-400">{total} total</span>
          </div>

          {!vouchers.length ? (
            <div className="py-16 text-center">
              <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No ITA vouchers</p>
              <p className="text-xs text-slate-400 mt-1">
                Vouchers appear here when WIOA participants are approved for training funding
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Participant', 'Voucher ID', 'WIOA Type', 'Program', 'Dates', 'Amount', 'Paid', 'Status', ''].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {vouchers.map((v: any) => {
                    const outstanding = Number(v.total_voucher_amount ?? 0) - Number(v.payments_to_date ?? 0);
                    const isExpiringSoon = v.voucher_expire_date && new Date(v.voucher_expire_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    return (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-900 whitespace-nowrap">{v.participant_name}</p>
                          {v.remittance_email && (
                            <a href={`mailto:${v.remittance_email}`} className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-blue-600 mt-0.5">
                              <Mail className="w-3 h-3" />{v.remittance_email}
                            </a>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-semibold text-slate-700">{v.voucher_id}</span>
                          {v.is_final && <span className="ml-1.5 text-[10px] font-bold text-rose-600 uppercase">Final</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${WIOA_TYPE_STYLES[v.wioa_type] ?? 'bg-slate-100 text-slate-600'}`}>
                            {v.wioa_type ?? '—'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <p className="text-xs text-slate-600 truncate">{v.service_name ?? '—'}</p>
                          <p className="text-[10px] text-slate-400 truncate">{v.fund_stream ?? ''}</p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="text-xs text-slate-600">
                            {v.voucher_date ? new Date(v.voucher_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </p>
                          <p className={`text-[10px] mt-0.5 ${isExpiringSoon ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                            Exp: {v.voucher_expire_date ? new Date(v.voucher_expire_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-semibold text-slate-900 tabular-nums">
                            ${Number(v.total_voucher_amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          {outstanding > 0 && (
                            <p className="text-[10px] text-amber-600 font-medium">
                              ${outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })} outstanding
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 tabular-nums text-slate-600 whitespace-nowrap">
                          ${Number(v.payments_to_date ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLES[v.status] ?? 'bg-slate-100 text-slate-600'}`}>
                            {v.status ?? 'unknown'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href={`/admin/funding/${v.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700 whitespace-nowrap">
                            View <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
