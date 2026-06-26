import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ChevronRight, Plus, FileText, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Grant Applications | Admin' };

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-600',
  in_review: 'bg-amber-100 text-amber-700',
  approved:  'bg-emerald-100 text-emerald-700',
  submitted: 'bg-blue-100 text-blue-700',
  awarded:   'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-700',
  archived:  'bg-slate-100 text-slate-400',
};

export default async function GrantApplicationsPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();

  const { data: applications } = await db
    .from('grant_applications')
    .select('id, opportunity_title, agency_name, deadline, status, budget_total, created_at, project_title')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/grants" className="hover:text-slate-700">Grants</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Applications</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Grant Applications</h1>
            <p className="text-sm text-slate-500 mt-1">Draft, submit, and track grant applications.</p>
          </div>
          <Link
            href="/admin/grants/applications/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Application
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {!applications?.length ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No applications yet.</p>
            <Link
              href="/admin/grants/applications/new"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-violet-600 font-semibold hover:underline"
            >
              <Plus className="w-4 h-4" /> Start your first application
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Opportunity', 'Agency', 'Deadline', 'Budget', 'Status', ''].map(h => (
                    <th key={h} className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {applications.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 font-medium text-slate-900 max-w-xs truncate">
                      {a.opportunity_title ?? a.project_title ?? '—'}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 text-xs">{a.agency_name ?? '—'}</td>
                    <td className="py-3.5 px-5 text-slate-500 text-xs">
                      {a.deadline ? new Date(a.deadline).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 text-xs">
                      {a.budget_total ? '$' + Number(a.budget_total).toLocaleString() : '—'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLES[a.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {a.status ?? 'draft'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link href={`/admin/grants/applications/${a.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700">
                        Edit <ArrowRight className="w-3 h-3" />
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
  );
}
