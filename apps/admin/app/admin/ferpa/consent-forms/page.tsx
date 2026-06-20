import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { FileText, CheckCircle, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function FerpaConsentFormsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();

  const { data: forms, count } = await db
    .from('documents')
    .select('id, file_name, status, created_at, user_id, profiles(full_name, email)', {
      count: 'exact',
    })
    .eq('document_type', 'consent')
    .order('created_at', { ascending: false })
    .limit(50);

  const signedCount =
    forms?.filter((f: any) => f.status === 'approved' || f.status === 'signed').length ?? 0;
  const pendingCount = forms?.filter((f: any) => f.status === 'pending').length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'FERPA', href: '/admin/ferpa' },
            { label: 'Consent Forms' },
          ]}
        />

        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-slate-900">FERPA Consent Forms</h1>
          <p className="text-slate-600 mt-1">
            Student consent forms authorizing disclosure of education records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-medium text-slate-600">Total Forms</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{count ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-slate-600">Signed</span>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{signedCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium text-slate-600">Pending</span>
            </div>
            <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">All Consent Forms</h2>
          </div>
          {!forms?.length ? (
            <div className="py-16 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No consent forms on file.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Student
                    </th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      File
                    </th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Date
                    </th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {forms.map((form: any) => (
                    <tr key={form.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-medium text-slate-900">
                          {form.profiles?.full_name ?? '—'}
                        </p>
                        <p className="text-xs text-slate-400">{form.profiles?.email ?? ''}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs font-mono truncate max-w-[200px]">
                        {form.file_name ?? form.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                            form.status === 'approved' || form.status === 'signed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : form.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {form.status ?? 'unknown'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {form.created_at ? new Date(form.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/documents/${form.id}`}
                          className="text-xs font-semibold text-brand-blue-600 hover:underline"
                        >
                          View
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
