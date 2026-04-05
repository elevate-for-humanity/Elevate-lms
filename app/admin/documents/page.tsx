import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { FileText, Upload, ChevronRight, Download, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Documents | Admin',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtBytes(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentsPage() {
  await requireAdmin();
  const db = createAdminClient();

  const { data: documents, count } = await db
    .from('documents')
    .select('id, title, file_name, filename, document_type, file_type, file_size, created_at, storage_path, url', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50);

  const docs = documents ?? [];

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-6 px-4 sm:px-6 lg:px-8">

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
            <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900 font-medium">Documents</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500 mt-1">{count ?? 0} documents on file</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/documents/templates"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            Templates
          </Link>
          <Link href="/admin/documents/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors">
            <Upload className="w-4 h-4" /> Upload
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {docs.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No documents yet</p>
            <p className="text-xs text-slate-500 mt-1">Upload documents to get started</p>
            <Link href="/admin/documents/upload"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors">
              <Upload className="w-4 h-4" /> Upload first document
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Name', 'Type', 'Size', 'Uploaded', ''].map((h, i) => (
                      <th key={i} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {docs.map((doc: any) => {
                    const name = doc.title || doc.file_name || doc.filename || 'Untitled';
                    const type = doc.document_type || doc.file_type || '—';
                    const href = doc.url || doc.storage_path || '#';
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-blue-50 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-brand-blue-600" />
                            </div>
                            <span className="font-semibold text-slate-900 truncate max-w-[200px]">{name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 capitalize">{type}</td>
                        <td className="px-5 py-3.5 text-slate-500 tabular-nums">{fmtBytes(doc.file_size)}</td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{fmtDate(doc.created_at)}</td>
                        <td className="px-5 py-3.5 text-right">
                          {href !== '#' ? (
                            <a href={href} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700">
                              <Download className="w-3 h-3" /> Download
                            </a>
                          ) : (
                            <Link href={`/admin/documents/${doc.id}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700">
                              View <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-slate-50">
              {docs.map((doc: any) => {
                const name = doc.title || doc.file_name || doc.filename || 'Untitled';
                const type = doc.document_type || doc.file_type || '—';
                const href = doc.url || doc.storage_path || '#';
                return (
                  <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-brand-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
                      <p className="text-xs text-slate-400">{type} · {fmtDate(doc.created_at)}</p>
                    </div>
                    {href !== '#' && (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-blue-600">
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
