'use client';

import { useState } from 'react';
import { FileText, Download, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';

interface Doc {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  status: string;
  reviewed_at: string | null;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const FILTERS = ['all', 'pending', 'approved', 'rejected'] as const;
type Filter = (typeof FILTERS)[number];

export default function ProgramHolderDocumentsClient({ initialDocs }: { initialDocs: Doc[] }) {
  const [docs, setDocs] = useState(initialDocs);
  const [filter, setFilter] = useState<Filter>('pending');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = filter === 'all' ? docs : docs.filter((d) => d.status === filter);

  const openDoc = async (doc: Doc) => {
    setLoadingId(doc.id);
    try {
      const res = await fetch('/api/admin/program-holder-documents/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: doc.file_path }),
      });
      if (!res.ok) throw new Error('Could not generate URL');
      const { url } = await res.json();
      window.open(url, '_blank');
    } catch (e) {
      alert('Could not open document. Check storage permissions.');
    } finally {
      setLoadingId(null);
    }
  };
  const review = async (doc: Doc, decision: 'approved' | 'rejected') => {
    setLoadingId(doc.id);
    try {
      const res = await fetch(`/api/admin/program-holder-documents/${doc.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) throw new Error('Review failed');
      setDocs((current) =>
        current.map((item) => (item.id === doc.id ? { ...item, status: decision } : item)),
      );
    } catch {
      alert('The review decision could not be saved.');
    } finally {
      setLoadingId(null);
    }
  };

  const fmtSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 sm:w-fit">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              filter === f
                ? 'bg-white shadow-sm text-slate-800'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            No {filter === 'all' ? '' : filter} documents
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100 md:hidden">
            {filtered.map((doc) => (
              <article key={doc.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {doc.profiles?.full_name ?? 'Unknown submitter'}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {doc.profiles?.email ?? 'No email available'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[doc.status] ?? 'bg-slate-100 text-slate-600'}`}
                  >
                    {doc.status === 'pending' && <Clock className="h-3 w-3" />}
                    {doc.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                    {doc.status === 'rejected' && <XCircle className="h-3 w-3" />}
                    {doc.status}
                  </span>
                </div>

                <div>
                  <p className="break-words text-sm font-medium text-slate-700">{doc.file_name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {doc.document_type.replace(/_/g, ' ')} · {fmtSize(doc.file_size)} ·{' '}
                    {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => openDoc(doc)}
                    disabled={loadingId === doc.id}
                    className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-brand-blue-700 disabled:opacity-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {loadingId === doc.id ? 'Opening…' : 'View document'}
                  </button>
                  {doc.status === 'pending' && (
                    <>
                      <button
                        onClick={() => review(doc, 'approved')}
                        disabled={loadingId === doc.id}
                        className="min-h-11 rounded-lg bg-green-700 px-3 text-sm font-bold text-white disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => review(doc, 'rejected')}
                        disabled={loadingId === doc.id}
                        className="min-h-11 rounded-lg border border-red-300 px-3 text-sm font-bold text-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>

          <table className="hidden w-full text-sm md:table">
            <thead className="bg-slate-50">
              <tr>
                {['Submitted By', 'Document', 'Type', 'Size', 'Status', 'Date', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 text-xs">
                      {doc.profiles?.full_name ?? '—'}
                    </p>
                    <p className="text-xs text-slate-400">{doc.profiles?.email ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-xs text-slate-700 truncate">{doc.file_name}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 capitalize">
                    {doc.document_type.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{fmtSize(doc.file_size)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[doc.status] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {doc.status === 'pending' && <Clock className="w-3 h-3" />}
                      {doc.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                      {doc.status === 'rejected' && <XCircle className="w-3 h-3" />}
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openDoc(doc)}
                        disabled={loadingId === doc.id}
                        className="flex items-center gap-1 text-xs text-brand-blue-600 hover:text-brand-blue-800 font-medium disabled:opacity-50"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {loadingId === doc.id ? 'Opening…' : 'View'}
                      </button>
                      {doc.status === 'pending' && (
                        <>
                          <button
                            onClick={() => review(doc, 'approved')}
                            disabled={loadingId === doc.id}
                            className="text-xs font-bold text-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => review(doc, 'rejected')}
                            disabled={loadingId === doc.id}
                            className="text-xs font-bold text-red-700"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
