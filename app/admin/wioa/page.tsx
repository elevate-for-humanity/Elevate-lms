import { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { HeartHandshake, CheckCircle, Clock, AlertTriangle, Plus, ChevronRight, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'WIOA | Admin' };

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-800',
  pending:  'bg-amber-100 text-amber-800',
  expired:  'bg-red-100 text-red-800',
  denied:   'bg-red-100 text-red-800',
  active:   'bg-emerald-100 text-emerald-800',
};

export default async function WioaPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await getAdminClient();

  const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    participantsRes,
    approvedRes,
    pendingRes,
    expiringRes,
  ] = await Promise.all([
    db.from('wioa_participants')
      .select('id, status, funding_amount, approved_at, expiration_date, student:profiles(full_name, email), program:programs(title)', { count: 'exact' })
      .order('created_at', { ascending: false }).limit(50),
    db.from('wioa_participants').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    db.from('wioa_participants').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('wioa_participants').select('*', { count: 'exact', head: true })
      .lte('expiration_date', soon).gte('expiration_date', new Date().toISOString()),
  ]);

  if (participantsRes.error) throw new Error(`wioa_participants query failed: ${participantsRes.error.message}`);
  if (approvedRes.error)     throw new Error(`wioa_participants approved count failed: ${approvedRes.error.message}`);
  if (pendingRes.error)      throw new Error(`wioa_participants pending count failed: ${pendingRes.error.message}`);
  if (expiringRes.error)     throw new Error(`wioa_participants expiring count failed: ${expiringRes.error.message}`);

  const participants = participantsRes.data;
  const total        = participantsRes.count;
  const approved     = approvedRes.count;
  const pending      = pendingRes.count;
  const expiring     = expiringRes.count;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">WIOA</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">WIOA Participants</h1>
            <p className="text-sm text-slate-500 mt-1">Workforce Innovation and Opportunity Act funding and participant tracking</p>
          </div>
          <Link href="/admin/wioa/new"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Add Participant
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total',            value: total ?? 0,    icon: HeartHandshake, color: 'text-brand-blue-600', bg: 'bg-brand-blue-50',  urgent: false },
            { label: 'Approved',         value: approved ?? 0, icon: CheckCircle,    color: 'text-green-600',      bg: 'bg-green-50',       urgent: false },
            { label: 'Pending Review',   value: pending ?? 0,  icon: Clock,          color: 'text-amber-600',      bg: 'bg-amber-50',       urgent: (pending ?? 0) > 0 },
            { label: 'Expiring 30 Days', value: expiring ?? 0, icon: AlertTriangle,  color: 'text-rose-600',       bg: 'bg-rose-50',        urgent: (expiring ?? 0) > 0 },
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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">All Participants</h2>
            <span className="text-xs text-slate-400">{total ?? 0} total</span>
          </div>
          {!participants?.length ? (
            <div className="py-16 text-center">
              <HeartHandshake className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No WIOA participants yet</p>
              <Link href="/admin/wioa/new" className="inline-flex items-center gap-1.5 mt-4 text-sm text-brand-blue-600 font-semibold hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add Participant
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Student</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Program</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Funding</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Expires</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {participants.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900">{p.student?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{p.student?.email ?? ''}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{p.program?.title ?? '—'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLES[p.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {p.status ?? 'unknown'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{p.funding_amount ? `$${Number(p.funding_amount).toLocaleString()}` : '—'}</td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">{p.expiration_date ? new Date(p.expiration_date).toLocaleDateString() : '—'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/admin/wioa/${p.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700">
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
