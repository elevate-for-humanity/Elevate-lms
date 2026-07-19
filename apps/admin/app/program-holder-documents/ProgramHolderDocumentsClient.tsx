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
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const FILTERS = ['all', 'pending', 'approved', 'rejected'] as const;
type Filter = typeof FILTERS[number];

export default function ProgramHolderDocumentsClient({ initialDocs }: { initialDocs: Doc[] }) {
  const [docs, setDocs] = useState(initialDocs);
  const [filter, setFilter] = useState<Filter>('pending');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = filter === 'all' ? docs : docs.filter(d => d.status === filter);

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

  const fmtSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              filter === f ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No {filter === 'all' ? '' : filter} documents</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Submitted By', 'Document', 'Type', 'Size', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 text-xs">{doc.profiles?.full_name ?? '—'}</p>
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
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[doc.status] ?? 'bg-slate-100 text-slate-600'}`}>
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
                    <button onClick={() => openDoc(doc)} disabled={loadingId === doc.id}
                      className="flex items-center gap-1 text-xs text-brand-blue-600 hover:text-brand-blue-800 font-medium disabled:opacity-50">
                      <ExternalLink className="w-3.5 h-3.5" />
                      {loadingId === doc.id ? 'Opening…' : 'View'}
                    </button>
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
