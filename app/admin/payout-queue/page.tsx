import { Metadata } from 'next';
import Link from 'next/link';
import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  DollarSign, AlertTriangle, Clock, CheckCircle,
  ArrowLeft, ExternalLink,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Payout Queue | Admin',
  robots: { index: false, follow: false },
};

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-800',
  due:      'bg-orange-100 text-orange-800',
  overdue:  'bg-red-100 text-red-800',
  paid:     'bg-emerald-100 text-emerald-800',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  due:     'Due Now',
  overdue: 'Overdue',
  paid:    'Paid',
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

function fmtUsd(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default async function PayoutQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // Auth guard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/payout-queue');

  const db = await getAdminClient();
  if (!db) redirect('/admin/dashboard');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/admin/dashboard');
  }

  const params = await searchParams;
  const filterStatus = params.status ?? 'all';

  // Fetch payout queue
  let query = db
    .from('program_enrollments')
    .select(`
      id, program_slug, student_start_date,
      voucher_issued_date, voucher_paid_date,
      payout_due_date, payout_status, payout_paid_date, payout_notes,
      user_id,
      program_holders:partner_id ( name, contact_name, contact_email )
    `)
    .neq('payout_status', 'not_triggered')
    .order('payout_due_date', { ascending: true, nullsFirst: false });

  if (filterStatus !== 'all') {
    query = query.eq('payout_status', filterStatus);
  }

  const { data: rawRows } = await query;

  // Hydrate profiles separately (user_id → auth.users, no FK to profiles)
  const payoutUserIds = [...new Set((rawRows ?? []).map((r: any) => r.user_id).filter(Boolean))];
  const { data: payoutProfiles } = payoutUserIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', payoutUserIds)
    : { data: [] };
  const payoutProfileMap = Object.fromEntries((payoutProfiles ?? []).map((p: any) => [p.id, p]));
  const rows = (rawRows ?? []).map((r: any) => ({ ...r, profiles: payoutProfileMap[r.user_id] ?? null }));

  const now = new Date();

  const queue = rows.map(row => ({
    ...row,
    payout_status: row.payout_status !== 'paid' && row.payout_due_date && new Date(row.payout_due_date) < now
      ? 'overdue'
      : row.payout_status,
    days_until_due: row.payout_due_date && row.payout_status !== 'paid'
      ? Math.ceil((new Date(row.payout_due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null,
  }));

  const counts = {
    all:     queue.length,
    pending: queue.filter(r => r.payout_status === 'pending').length,
    due:     queue.filter(r => r.payout_status === 'due').length,
    overdue: queue.filter(r => r.payout_status === 'overdue').length,
    paid:    queue.filter(r => r.payout_status === 'paid').length,
  };

  const FILTERS = [
    { key: 'all',     label: 'All' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'due',     label: 'Due Now' },
    { key: 'pending', label: 'Pending' },
    { key: 'paid',    label: 'Paid' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/dashboard" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Partner Payout Queue</h1>
            <p className="text-sm text-slate-500">MOU-triggered payouts — 10 business days from voucher receipt</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {counts.overdue > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium text-red-700">Overdue</span>
              </div>
              <p className="text-2xl font-bold text-red-800">{counts.overdue}</p>
              <p className="text-xs text-red-600">{fmtUsd(counts.overdue * 2500)} owed</p>
            </div>
          )}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-amber-700">Pending</span>
            </div>
            <p className="text-2xl font-bold text-amber-800">{counts.pending}</p>
            <p className="text-xs text-amber-600">{fmtUsd(counts.pending * 2500)} queued</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-700">Paid</span>
            </div>
            <p className="text-2xl font-bold text-emerald-800">{counts.paid}</p>
            <p className="text-xs text-emerald-600">{fmtUsd(counts.paid * 2500)} disbursed</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-600">Total</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{counts.all}</p>
            <p className="text-xs text-slate-500">enrollments tracked</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {FILTERS.map(f => (
            <Link
              key={f.key}
              href={`/admin/payout-queue?status=${f.key}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === f.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
              {' '}
              <span className="opacity-60">({counts[f.key as keyof typeof counts]})</span>
            </Link>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {queue.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No payouts in this category.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Partner</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Program</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Voucher Paid</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Payout Due</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.map(row => {
                    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
                    const partner = Array.isArray(row.program_holders) ? row.program_holders[0] : row.program_holders;
                    const isUrgent = row.days_until_due !== null && row.days_until_due <= 2 && row.payout_status !== 'paid';

                    return (
                      <tr key={row.id} className={`hover:bg-slate-50 ${isUrgent ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{profile?.full_name ?? '—'}</p>
                          <p className="text-xs text-slate-400">{profile?.email ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{partner?.name ?? '—'}</p>
                          <p className="text-xs text-slate-400">{partner?.contact_email ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {row.program_slug?.replace(/-/g, ' ') ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{fmtDate(row.voucher_paid_date)}</td>
                        <td className="px-4 py-3">
                          <p className={`font-medium ${row.payout_status === 'overdue' ? 'text-red-600' : 'text-slate-800'}`}>
                            {fmtDate(row.payout_due_date)}
                          </p>
                          {row.days_until_due !== null && row.payout_status !== 'paid' && (
                            <p className={`text-xs ${row.days_until_due < 0 ? 'text-red-500' : row.days_until_due <= 2 ? 'text-orange-500' : 'text-slate-400'}`}>
                              {row.days_until_due < 0
                                ? `${Math.abs(row.days_until_due)}d overdue`
                                : row.days_until_due === 0
                                ? 'Due today'
                                : `${row.days_until_due}d remaining`}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[row.payout_status] ?? 'bg-slate-100 text-slate-600'}`}>
                            {STATUS_LABELS[row.payout_status] ?? row.payout_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">$2,500</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/students/${row.user_id}`}
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View
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
