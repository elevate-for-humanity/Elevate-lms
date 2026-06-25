import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Download, ChevronRight, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import RapidsExportClient from './RapidsExportClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'RAPIDS | Admin | Elevate For Humanity' };

export default async function RapidsPage() {
  await requireRole(['admin']);
  const db = await requireAdminClient();

  const [
    { count: pendingReg },
    { count: pendingProgress },
    { count: pendingCompletion },
    { data: recentSubmissions },
  ] = await Promise.all([
    db.from('rapids_registrations').select('*', { count: 'exact', head: true }).is('submitted_at', null),
    db.from('rapids_progress_updates').select('*', { count: 'exact', head: true }).is('submitted_at', null).catch(() => ({ count: 0 })),
    db.from('rapids_registrations').select('*', { count: 'exact', head: true }).eq('status', 'completed').is('submitted_at', null).catch(() => ({ count: 0 })),
    db.from('rapids_submissions')
      .select('id, submission_type, submission_date, record_count, status, submitted_by')
      .order('submission_date', { ascending: false })
      .limit(10),
  ]);

  const stats = [
    { label: 'Pending Registrations', value: pendingReg ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Pending Progress Updates', value: pendingProgress ?? 0, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Completions', value: pendingCompletion ?? 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">RAPIDS</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">RAPIDS Submissions</h1>
        <p className="text-sm text-slate-500 mt-1">
          DOL Registered Apprenticeship Partners Information Data System — generate CSV exports for bulk upload
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Export UI */}
      <RapidsExportClient />

      {/* Recent submissions */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Recent Submissions</h2>
        </div>
        {!recentSubmissions?.length ? (
          <p className="text-sm text-slate-400 text-center py-8">No submissions recorded yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Type', 'Date', 'Records', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSubmissions.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 capitalize font-medium text-slate-700">{s.submission_type}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(s.submission_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-600">{s.record_count}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      s.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      s.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      s.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
