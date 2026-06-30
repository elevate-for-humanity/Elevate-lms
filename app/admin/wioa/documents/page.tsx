import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import {
  FileText,
  ChevronRight,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'WIOA Documents | Admin',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  review: 'bg-blue-100 text-blue-800',
};

export default async function WIOADocumentsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();

  const [docsRes, pendingRes, approvedRes] = await Promise.all([
    db
      .from('wioa_documents')
      .select('id, document_type, file_name, status, created_at, updated_at, user_id', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('wioa_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('wioa_documents').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
  ]);

  const docs = docsRes.data ?? [];
  const totalCount = docsRes.count ?? 0;
  const pendingCount = pendingRes.count ?? 0;
  const approvedCount = approvedRes.count ?? 0;

  // Hydrate user profiles
  const userIds = [...new Set(docs.map((d: any) => d.user_id).filter(Boolean))];
  const { data: profiles } = userIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', userIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));

  // Group by document_type for folder view
  const typeCountMap: Record<string, number> = {};
  for (const d of docs) {
    const t = (d as any).document_type || 'other';
    typeCountMap[t] = (typeCountMap[t] || 0) + 1;
  }
  const typeLabels: Record<string, string> = {
    eligibility: 'Eligibility Forms',
    income: 'Income Verification',
    training: 'Training Agreements',
    outcome: 'Outcome Documentation',
    support: 'Support Services',
    other: 'Other',
  };

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
          <span className="text-slate-900 font-medium">Documents</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">WIOA Documents</h1>
            <p className="text-sm text-slate-500 mt-1">
              Federal funding documentation and participant records
            </p>
          </div>
          <Link
            href="/admin/wioa/documents"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Upload Document
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Total Documents',
              value: totalCount,
              icon: FileText,
              color: 'text-slate-600',
              bg: 'bg-slate-100',
            },
            {
              label: 'Pending Review',
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

        {/* Document type folders */}
        {Object.keys(typeCountMap).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(typeCountMap).map(([type, count]) => (
              <div
                key={type}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-brand-blue-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <FileText className="w-6 h-6 text-brand-blue-500 mb-2" />
                <p className="text-sm font-semibold text-slate-900">
                  {typeLabels[type] ??
                    type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {count} document{count !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Documents table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">All Documents</h2>
            <span className="text-xs text-slate-400">{totalCount} total</span>
          </div>
          {docs.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No WIOA documents uploaded yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Participant', 'Document Type', 'File', 'Status', 'Uploaded', ''].map((h) => (
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
                {docs.map((d: any) => {
                  const p = profileMap[d.user_id];
                  return (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900">{p?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{p?.email ?? ''}</p>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 capitalize">
                        {(d.document_type ?? 'other').replace(/_/g, ' ')}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 text-xs truncate max-w-[160px]">
                        {d.file_name ?? '—'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLES[d.status] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {d.status ?? 'unknown'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 text-xs">
                        {d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/admin/wioa/documents/${d.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700"
                        >
                          Review <ArrowRight className="w-3 h-3" />
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
