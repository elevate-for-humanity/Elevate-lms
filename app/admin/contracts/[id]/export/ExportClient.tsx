'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, FileText, Loader2, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';

type PrevExport = {
  id: string;
  export_type: string;
  status: string;
  file_size: number | null;
  created_at: string;
};

function fmtBytes(n: number | null) {
  if (!n) return '—';
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ExportClient({
  contractId,
  contractTitle,
  agencyName,
  runId,
  runStatus,
  approvedCount,
  previousExports,
  isPdf,
}: {
  contractId: string;
  contractTitle: string;
  agencyName: string | null;
  runId: string;
  runStatus: string;
  approvedCount: number;
  previousExports: PrevExport[];
  isPdf: boolean;
}) {
  const [exportType, setExportType] = useState<'pdf' | 'docx'>(isPdf ? 'pdf' : 'docx');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportId, setExportId] = useState<string | null>(null);

  const canExport = runStatus === 'approved' || approvedCount > 0;

  async function generate() {
    setGenerating(true);
    setError(null);
    setDownloadUrl(null);

    try {
      const res = await fetch('/api/admin/contracts/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_id: contractId, run_id: runId, export_type: exportType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setDownloadUrl(data.download_url);
      setExportId(data.export_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <Link href={`/admin/contracts/${contractId}`} className="hover:text-slate-700 flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> {contractTitle}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900">Export</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Export Document</h1>
        {agencyName && <p className="text-sm text-slate-500 mt-1">{agencyName}</p>}
      </div>

      {!canExport && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">No approved fields yet</p>
            <p className="text-xs text-amber-700 mt-0.5">
              <Link href={`/admin/contracts/${contractId}/prefill?run=${runId}`} className="underline">
                Review and approve fields
              </Link>{' '}
              before exporting.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-5">
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-1">Export format</p>
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            {(['pdf', 'docx'] as const).map(t => (
              <button key={t} onClick={() => setExportType(t)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
                  exportType === t ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}>
                <FileText className="w-4 h-4" /> {t.toUpperCase()}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {exportType === 'pdf'
              ? 'PDF: fills the original template with approved values and embeds the signature.'
              : 'DOCX: generates a Word document with all approved fields as labeled sections.'}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-600 space-y-1">
          <p><strong>{approvedCount}</strong> approved fields will be written into the document.</p>
          <p className="text-xs text-slate-400">
            Only admin-approved values are included. The download link expires in 1 hour.
            Store the exported file securely — it is not publicly accessible.
          </p>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {downloadUrl ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-semibold">Export ready</span>
            </div>
            <p className="text-xs text-green-600">Download link expires in 1 hour. Save the file immediately.</p>
            <a
              href={downloadUrl}
              download
              className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition-colors"
            >
              <Download className="w-4 h-4" /> Download {exportType.toUpperCase()}
            </a>
          </div>
        ) : (
          <button
            onClick={generate}
            disabled={generating || !canExport}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {generating
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
              : <><Download className="w-4 h-4" /> Generate {exportType.toUpperCase()}</>}
          </button>
        )}
      </div>

      {/* Previous exports */}
      {previousExports.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-700">Previous exports</span>
          </div>
          <div className="divide-y divide-slate-50">
            {previousExports.map(e => (
              <div key={e.id} className="px-5 py-3 flex items-center gap-3">
                <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700">{e.export_type.toUpperCase()}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(e.created_at).toLocaleString()} · {fmtBytes(e.file_size)}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  e.status === 'ready' ? 'bg-green-100 text-green-700' :
                  e.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-600'
                }`}>{e.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Link href={`/admin/contracts/${contractId}/sign?run=${runId}`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Back to signature
        </Link>
        <Link href={`/admin/contracts/${contractId}`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 ml-4">
          Contract overview
        </Link>
      </div>
    </div>
  );
}
