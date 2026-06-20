import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import {
  Target,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
  Phone,
  Mail,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'CRM Leads | Admin',
};

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-purple-100 text-purple-800',
  qualified: 'bg-amber-100 text-amber-800',
  proposal: 'bg-orange-100 text-orange-800',
  negotiation: 'bg-yellow-100 text-yellow-800',
  closed_won: 'bg-green-100 text-green-800',
  closed_lost: 'bg-red-100 text-red-800',
};

export default async function CRMLeadsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();

  const staleDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

  const [leadsRes, wonRes, lostRes, staleRes] = await Promise.all([
    db
      .from('leads')
      .select(
        'id, first_name, last_name, email, phone, status, source, program_interest, created_at, updated_at',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'closed_won'),
    db.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'closed_lost'),
    db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .not('status', 'in', '(closed_won,closed_lost)')
      .lt('updated_at', staleDate),
  ]);

  const leads = leadsRes.data ?? [];
  const totalCount = leadsRes.count ?? 0;
  const wonCount = wonRes.count ?? 0;
  const lostCount = lostRes.count ?? 0;
  const staleCount = staleRes.count ?? 0;
  const openCount = totalCount - wonCount - lostCount;
  const winRate =
    wonCount + lostCount > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0;

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  for (const l of leads) {
    const s = (l as any).status || 'unknown';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">
            Admin
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/crm" className="hover:text-slate-700">
            CRM
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Leads</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
            <p className="text-sm text-slate-500 mt-1">
              {totalCount} total leads · {winRate}% win rate
            </p>
          </div>
          <Link
            href="/admin/crm/leads/new"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Open Leads',
              value: openCount,
              icon: Target,
              color: 'text-brand-blue-600',
              bg: 'bg-brand-blue-50',
            },
            {
              label: 'Won',
              value: wonCount,
              icon: CheckCircle,
              color: 'text-green-600',
              bg: 'bg-green-50',
            },
            {
              label: 'Stale (5d+)',
              value: staleCount,
              icon: Clock,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
              urgent: staleCount > 0,
            },
            {
              label: 'Win Rate',
              value: `${winRate}%`,
              icon: TrendingUp,
              color: 'text-purple-600',
              bg: 'bg-purple-50',
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={`bg-white rounded-2xl border shadow-sm p-5 ${(s as any).urgent ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'}`}
              >
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Status pipeline */}
        {Object.keys(statusCounts).length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4 text-sm">Pipeline by Status</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <div
                    key={status}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}
                  >
                    <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                    <span className="bg-white bg-opacity-60 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Leads table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">All Leads</h2>
            <span className="text-xs text-slate-400">{totalCount} total</span>
          </div>
          {leads.length === 0 ? (
            <div className="py-16 text-center">
              <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No leads yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Lead', 'Contact', 'Program', 'Status', 'Last Activity', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leads.map((l: any) => {
                  const name =
                    [l.first_name, l.last_name].filter(Boolean).join(' ') || l.email || '—';
                  const daysSince = l.updated_at
                    ? Math.floor((Date.now() - new Date(l.updated_at).getTime()) / 86400000)
                    : null;
                  const isStale =
                    daysSince !== null &&
                    daysSince >= 5 &&
                    !['closed_won', 'closed_lost'].includes(l.status);
                  return (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900">{name}</p>
                        {l.source && <p className="text-xs text-slate-400">via {l.source}</p>}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex flex-col gap-0.5">
                          {l.email && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Mail className="w-3 h-3" />
                              {l.email}
                            </span>
                          )}
                          {l.phone && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Phone className="w-3 h-3" />
                              {l.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 text-xs">
                        {l.program_interest ?? '—'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLES[l.status] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {(l.status ?? 'unknown').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        {daysSince !== null && (
                          <span
                            className={`text-xs font-medium ${isStale ? 'text-amber-600' : 'text-slate-500'}`}
                          >
                            {daysSince === 0 ? 'Today' : `${daysSince}d ago`}
                            {isStale && ' ⚠'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/admin/crm/leads/${l.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700"
                        >
                          View <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
