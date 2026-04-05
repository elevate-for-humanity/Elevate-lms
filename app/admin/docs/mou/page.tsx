import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/authGuards';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'MOU Documents | Admin | Elevate For Humanity',
};

const STATUS_BADGE: Record<string, string> = {
  draft:    'bg-gray-100 text-gray-600',
  sent:     'bg-blue-100 text-blue-800',
  signed:   'bg-green-100 text-green-800',
  expired:  'bg-red-100 text-red-800',
  archived: 'bg-slate-100 text-slate-600',
};

export default async function MouDocumentsPage() {
  await requireAdmin();
  const db = createAdminClient();

  const { data: documents } = await db
    .from('mou_documents')
    .select('*')
    .order('updated_at', { ascending: false });

  const rows = documents ?? [];
  const signed  = rows.filter((r: any) => r.document_status === 'signed').length;
  const expiring = rows.filter((r: any) => {
    if (!r.expiration_date) return false;
    const exp = new Date(r.expiration_date);
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    return exp >= new Date() && exp <= soon;
  }).length;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Docs', href: '/admin/docs' }, { label: 'MOUs' }]} />

        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">MOU Documents</h1>
            <p className="text-gray-500 text-sm mt-1">Live MOU records from the database</p>
          </div>
          <Link href="/admin/docs/mou/new"
            className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            + New MOU
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total MOUs',         value: rows.length },
            { label: 'Signed',             value: signed },
            { label: 'Expiring in 30 Days', value: expiring },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-lg border p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{kpi.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50">
            <h2 className="font-semibold text-slate-800">Documents</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {['Title', 'Organization', 'Status', 'Effective', 'Expiration', 'File'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{r.title}</td>
                    <td className="px-4 py-3 text-slate-600">{r.organization_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[r.document_status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {r.document_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.effective_date ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{r.expiration_date ?? '—'}</td>
                    <td className="px-4 py-3">
                      {r.file_url ? (
                        <a href={r.file_url} target="_blank" rel="noreferrer"
                          className="text-brand-blue-600 hover:underline text-xs font-medium">
                          Open
                        </a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No MOU documents yet. Add your first document to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
