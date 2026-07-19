import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Internal Docs | Admin',
};

export default async function InternalDocsPage() {
  await requireRole(['admin']);
  const db = await requireAdminClient();

  // documents: id, document_type, file_name, status, created_at, expiration_date, user_id
  const [
    { data: docs, count: total },
    { count: pending },
    { count: approved },
    { count: rejected },
  ] = await Promise.all([
    db
      .from('documents')
      .select(
        'id, document_type, file_name, status, created_at, expiration_date, profiles!documents_user_id_fkey(full_name, email)',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('documents').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    db.from('documents').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Internal Docs' }]} />

        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Internal Docs</h1>
            <p className="text-slate-600 text-sm mt-1">
              Staff documents, SOPs, and uploaded files — {total ?? 0} total
            </p>
          </div>
          <Link
            href="/admin/document-center"
            className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700"
          >
            Document Center
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: total ?? 0, icon: FileText, color: 'text-slate-900' },
            { label: 'Pending', value: pending ?? 0, icon: Clock, color: 'text-yellow-600' },
            { label: 'Approved', value: approved ?? 0, icon: CheckCircle, color: 'text-green-600' },
            { label: 'Rejected', value: rejected ?? 0, icon: XCircle, color: 'text-red-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="text-sm text-slate-600">{label}</span>
              </div>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-slate-900">Documents</h2>
          </div>
          {docs && docs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Owner</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">File</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Type</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Uploaded</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {docs.map((doc: any) => {
                    const profile = doc.profiles as any;
                    const isExpired =
                      doc.expiration_date && new Date(doc.expiration_date) < new Date();
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">
                            {profile?.full_name ?? 'Unknown'}
                          </p>
                          <p className="text-xs text-slate-500">{profile?.email ?? ''}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-700 max-w-xs truncate">
                          {doc.file_name}
                        </td>
                        <td className="px-6 py-4 text-slate-600 capitalize">
                          {doc.document_type?.replace(/_/g, ' ') ?? '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isExpired
                                ? 'bg-slate-100 text-slate-700'
                                : doc.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : doc.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : doc.status === 'rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isExpired ? 'expired' : doc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/documents/review/${doc.id}`}
                            className="text-brand-blue-600 hover:underline text-xs font-medium"
                          >
                            Review →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500">No documents found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
