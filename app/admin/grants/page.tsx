import { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { Briefcase, CheckCircle, Clock, Plus, ChevronRight, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'Grants | Admin' };

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-emerald-100 text-emerald-800',
  pending:  'bg-amber-100 text-amber-800',
  closed:   'bg-slate-100 text-slate-600',
  expired:  'bg-red-100 text-red-800',
};

export default async function GrantsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await getAdminClient();

  const [grantsRes, activeRes, pendingRes] = await Promise.all([
    db.from('grants')
      .select('id, name, funder, amount, status, start_date, end_date, created_at', { count: 'exact' })
      .order('created_at', { ascending: false }).limit(50),
    db.from('grants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('grants').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  if (grantsRes.error)  throw new Error(`grants query failed: ${grantsRes.error.message}`);
  if (activeRes.error)  throw new Error(`grants active count failed: ${activeRes.error.message}`);
  if (pendingRes.error) throw new Error(`grants pending count failed: ${pendingRes.error.message}`);

  const grants  = grantsRes.data;
  const total   = grantsRes.count;
  const active  = activeRes.count;
  const pending = pendingRes.count;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Grants</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Grants</h1>
            <p className="text-sm text-slate-500 mt-1">Federal, state, and private grant tracking</p>
          </div>
          <Link href="/admin/grants/new"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Add Grant
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Grants', value: total ?? 0,   icon: Briefcase,   color: 'text-brand-blue-600', bg: 'bg-brand-blue-50' },
            { label: 'Active',       value: active ?? 0,  icon: CheckCircle, color: 'text-green-600',      bg: 'bg-green-50' },
            { label: 'Pending',      value: pending ?? 0, icon: Clock,       color: 'text-amber-600',      bg: 'bg-amber-50' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
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
            <h2 className="font-semibold text-slate-900 text-sm">Grant Records</h2>
            <span className="text-xs text-slate-400">{total ?? 0} total</span>
          </div>
          {!grants?.length ? (
            <div className="py-16 text-center">
              <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No grants recorded</p>
              <Link href="/admin/grants/new" className="inline-flex items-center gap-1.5 mt-4 text-sm text-brand-blue-600 font-semibold hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add Grant
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Grant</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Funder</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Period</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {grants.map((g: any) => (
                    <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-slate-900">{g.name}</td>
                      <td className="py-3.5 px-4 text-slate-500">{g.funder ?? '—'}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{g.amount ? `$${Number(g.amount).toLocaleString()}` : '—'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLES[g.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {g.status ?? 'unknown'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {g.start_date ? new Date(g.start_date).toLocaleDateString() : '—'}
                        {g.end_date ? ` – ${new Date(g.end_date).toLocaleDateString()}` : ''}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/admin/grants/${g.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700">
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
