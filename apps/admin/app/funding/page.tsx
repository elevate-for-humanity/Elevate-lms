import { Metadata } from 'next';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { DollarSign, CheckCircle, Clock, AlertTriangle, ChevronRight, ArrowRight, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Funding | Admin' };

type VoucherRow = {
  id: string;
  voucher_id?: string | null;
  participant_name?: string | null;
  wioa_type?: string | null;
  fund_stream?: string | null;
  service_name?: string | null;
  voucher_date?: string | null;
  voucher_expire_date?: string | null;
  total_voucher_amount?: number | string | null;
  payments_to_date?: number | string | null;
  status?: string | null;
  is_final?: boolean | null;
  remittance_email?: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-800', pending: 'bg-amber-100 text-amber-800',
  invoiced: 'bg-blue-100 text-blue-800', paid: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800', denied: 'bg-red-100 text-red-800',
};

export default async function FundingPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();
  const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [vouchersRes, approvedRes, pendingRes, expiringRes] = await Promise.all([
    db.from('ita_vouchers')
      .select('id, voucher_id, participant_name, wioa_type, fund_stream, service_name, voucher_date, voucher_expire_date, total_voucher_amount, payments_to_date, status, is_final, remittance_email', { count: 'exact' })
      .order('voucher_date', { ascending: false })
      .limit(100),
    db.from('ita_vouchers').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    db.from('ita_vouchers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('ita_vouchers').select('id', { count: 'exact', head: true }).eq('status', 'approved').lte('voucher_expire_date', soon),
  ]);

  const vouchers = (Array.isArray(vouchersRes.data) ? vouchersRes.data : []) as unknown as VoucherRow[];
  const total = vouchersRes.count ?? vouchers.length;
  const approved = approvedRes.count ?? 0;
  const pending = pendingRes.count ?? 0;
  const expiring = expiringRes.count ?? 0;
  const totalAuthorized = vouchers.reduce((sum, voucher) => sum + Number(voucher.total_voucher_amount ?? 0), 0);
  const totalPaid = vouchers.reduce((sum, voucher) => sum + Number(voucher.payments_to_date ?? 0), 0);
  const outstanding = totalAuthorized - totalPaid;

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 px-6 py-8 text-white">
        <div className="mx-auto max-w-7xl">
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-emerald-50"><Link href="/dashboard">Admin</Link><ChevronRight className="h-3 w-3" /><span>Funding</span></nav>
          <h1 className="text-3xl font-black">Funding Operations</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-emerald-50">Track WIOA/ITA approvals, voucher value, paid amounts, and upcoming expirations from live funding records.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-7">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Total vouchers', total, FileText, 'bg-blue-50 text-blue-700'],
            ['Approved', approved, CheckCircle, 'bg-emerald-50 text-emerald-700'],
            ['Pending', pending, Clock, 'bg-amber-50 text-amber-700'],
            ['Expiring ≤30 days', expiring, AlertTriangle, 'bg-rose-50 text-rose-700'],
          ].map(([label, value, Icon, tone]) => {
            const CardIcon = Icon as typeof FileText;
            return <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`inline-flex rounded-xl p-2.5 ${String(tone)}`}><CardIcon className="h-5 w-5" /></div><div className="mt-4 text-2xl font-black text-slate-950">{String(value)}</div><div className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{String(label)}</div></div>;
          })}
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ['Authorized', totalAuthorized], ['Paid to date', totalPaid], ['Outstanding', outstanding],
          ].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-xs font-black uppercase tracking-wide text-slate-500">{String(label)}</div><div className="mt-2 text-2xl font-black text-slate-950">${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></div>)}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><div><h2 className="font-black text-slate-950">ITA Vouchers</h2><p className="text-sm font-medium text-slate-500">Live voucher and remittance data</p></div><DollarSign className="h-5 w-5 text-emerald-700" /></div>
          {vouchers.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500"><tr>{['Participant','Voucher','Program','Amount','Paid','Status',''].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {vouchers.map((voucher) => <tr key={voucher.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-black text-slate-900">{voucher.participant_name || 'Participant'}</td><td className="px-4 py-3 text-slate-600">{voucher.voucher_id || '—'}</td><td className="px-4 py-3 text-slate-600">{voucher.service_name || voucher.fund_stream || '—'}</td><td className="px-4 py-3 font-bold text-slate-900">${Number(voucher.total_voucher_amount ?? 0).toLocaleString()}</td><td className="px-4 py-3 text-slate-600">${Number(voucher.payments_to_date ?? 0).toLocaleString()}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-black ${STATUS_STYLES[voucher.status || ''] || 'bg-slate-100 text-slate-700'}`}>{voucher.status || 'unknown'}</span></td><td className="px-4 py-3"><Link href={`/admin/funding/${voucher.id}`} className="inline-flex items-center gap-1 font-black text-blue-700">View<ArrowRight className="h-3.5 w-3.5" /></Link></td></tr>)}
                </tbody>
              </table>
            </div>
          ) : <div className="p-10 text-center text-sm font-semibold text-slate-500">No ITA vouchers found.</div>}
        </section>
      </div>
    </main>
  );
}
