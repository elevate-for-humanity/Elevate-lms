import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: `FERPA Access Requests | Admin | ${PLATFORM_DEFAULTS.orgName}`,
};

async function getAccessRequests() {
  const adminClient = await requireAdminClient();
  const fallback = await createClient();
  const db = adminClient ?? fallback;

  const { data, error } = await db
    .from('documents')
    .select('id, user_id, document_type, status, created_at, notes, profiles(full_name, email)')
    .eq('document_type', 'access_request')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return [];
  return data ?? [];
}

const statusIcon = (status: string) => {
  if (status === 'approved') return <CheckCircle className="w-4 h-4 text-green-600" />;
  if (status === 'rejected') return <XCircle className="w-4 h-4 text-red-600" />;
  return <Clock className="w-4 h-4 text-amber-500" />;
};

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default async function FerpaAccessRequestsPage() {
  await requireRole(['admin']);
  const requests = await getAccessRequests();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'FERPA', href: '/admin/ferpa' },
            { label: 'Access Requests' },
          ]}
        />

        <div className="mt-6 mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">FERPA Access Requests</h1>
            <p className="text-slate-600 mt-1">
              Student requests to inspect or amend their education records under 20 U.S.C. § 1232g.
            </p>
          </div>
          <span className="text-sm text-slate-500">{requests.length} total</span>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No access requests on file</p>
            <p className="text-slate-500 text-sm mt-1">
              Requests submitted via the student portal will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-slate-700">Student</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-700">Submitted</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-700">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-700">Notes</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">
                        {r.profiles?.full_name ?? r.profiles?.email ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500">{r.profiles?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(r.status)}
                        <span className="text-slate-700">{statusLabel[r.status] ?? r.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{r.notes ?? '—'}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/documents/${r.id}`}
                        className="text-brand-blue-600 hover:underline text-sm font-medium"
                      >
                        Review
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
