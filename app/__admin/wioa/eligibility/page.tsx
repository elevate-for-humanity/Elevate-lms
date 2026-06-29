import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import {
  Users,
  ChevronRight,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'WIOA Eligibility | Admin',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  denied: 'bg-red-100 text-red-800',
  incomplete: 'bg-slate-100 text-slate-600',
  in_review: 'bg-blue-100 text-blue-800',
};

export default async function WIOAEligibilityPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();

  // wioa_applications may not exist — fall back to applications with wioa funding
  const [appsRes, pendingRes, approvedRes, deniedRes] = await Promise.all([
    db
      .from('applications')
      .select(
        'id, first_name, last_name, email, status, program_interest, created_at, eligibility_status',
        { count: 'exact' },
      )
      .not('eligibility_status', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100),
    db
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('eligibility_status', 'pending'),
    db
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('eligibility_status', 'approved'),
    db
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('eligibility_status', 'denied'),
  ]);

  const apps = appsRes.data ?? [];
  const totalCount = appsRes.count ?? 0;
  const pendingCount = pendingRes.count ?? 0;
  const approvedCount = approvedRes.count ?? 0;
  const deniedCount = deniedRes.count ?? 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">
            Admin
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/wioa" className="hover:text-slate-700">
            WIOA
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Eligibility</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">WIOA Eligibility Determinations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review and process WIOA eligibility for applicants
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total',
              value: totalCount,
              icon: Users,
              color: 'text-slate-600',
              bg: 'bg-slate-100',
            },
            {
              label: 'Pending',
              value: pendingCount,
              icon: Clock,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
              urgent: pendingCount > 0,
            },
            {
              label: 'Approved',
              value: approvedCount,
              icon: CheckCircle,
              color: 'text-green-600',
              bg: 'bg-green-50',
            },
            {
              label: 'Denied',
              value: deniedCount,
              icon: XCircle,
              color: 'text-red-600',
              bg: 'bg-red-50',
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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">Eligibility Queue</h2>
            <span className="text-xs text-slate-400">{totalCount} applicants</span>
          </div>
          {apps.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No eligibility determinations on record</p>
              <p className="text-xs text-slate-400 mt-1">
                Eligibility status is set during the application review process
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Applicant', 'Program', 'Eligibility Status', 'Applied', ''].map((h) => (
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
                {apps.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-slate-900">
                        {[a.first_name, a.last_name].filter(Boolean).join(' ') || '—'}
                      </p>
                      <p className="text-xs text-slate-400">{a.email ?? ''}</p>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 text-xs">
                      {a.program_interest ?? '—'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLES[a.eligibility_status] ?? 'bg-slate-100 text-slate-600'}`}
                      >
                        {a.eligibility_status ?? 'unknown'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 text-xs">
                      {a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/admin/applications/review/${a.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700"
                      >
                        Review <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
