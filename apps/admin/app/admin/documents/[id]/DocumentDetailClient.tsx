'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, FileText, FileImage, File, Loader2,
  Sparkles, CheckCircle2, AlertTriangle, ExternalLink,
  ChevronRight, Map, Clock,
} from 'lucide-react';

type Doc = {
  id: string;
  title: string | null;
  file_name: string | null;
  document_type: string | null;
  mime_type: string | null;
  file_size: number | null;
  file_size_bytes: number | null;
  file_path: string | null;
  file_url: string | null;
  url: string | null;
  status: string | null;
  extraction_status: string | null;
  extracted_data: Record<string, unknown> | null;
  ocr_text: string | null;
  ocr_confidence: number | null;
  processed_at: string | null;
  created_at: string;
};

type Mapping = {
  id: string;
  field_key: string;
  field_value: string | null;
  target_table: string | null;
  target_column: string | null;
  approved: boolean;
};

function fmtBytes(n: number | null | undefined) {
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, string> = {
    pending:    'bg-slate-100 text-slate-600',
    processing: 'bg-amber-100 text-amber-700',
    extracted:  'bg-green-100 text-green-700',
    failed:     'bg-red-100 text-red-700',
    skipped:    'bg-slate-100 text-slate-500',
  };
  const cls = map[status ?? 'pending'] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status ?? 'pending'}
    </span>
  );
}

export default function DocumentDetailClient({
  doc,
  mappings,
}: {
  doc: Doc;
  mappings: Mapping[];
}) {
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractionStatus, setExtractionStatus] = useState(doc.extraction_status);
  const [extractedData, setExtractedData] = useState<Record<string, unknown> | null>(doc.extracted_data);
  const [ocrText, setOcrText] = useState(doc.ocr_text);

  const fileUrl = doc.file_url || doc.url;
  const mime = doc.mime_type || doc.document_type || '';
  const isPdf = mime.includes('pdf') || doc.file_name?.endsWith('.pdf');
  const isImage = mime.startsWith('image/');
  const name = doc.title || doc.file_name || 'Untitled';

  const extractedFields = useMemo(() => {
    if (!extractedData) return [];
    const fields = (extractedData as { fields?: Record<string, string> }).fields ?? {};
    return Object.entries(fields).filter(([, v]) => v);
  }, [extractedData]);

  async function triggerExtraction() {
    setExtracting(true);
    setExtractError(null);
    try {
      const res = await fetch('/api/admin/documents/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: doc.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setExtractionStatus('extracted');
      setExtractedData(data.extracted_data ?? null);
      setOcrText(data.ocr_text ?? null);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Extraction failed');
      setExtractionStatus('failed');
    } finally {
      setExtracting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
            <Link href="/admin/documents" className="hover:text-slate-700">Documents</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900 font-medium truncate max-w-[200px]">{name}</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <StatusBadge status={extractionStatus} />
            <span className="text-xs text-slate-400">{fmtDate(doc.created_at)}</span>
            <span className="text-xs text-slate-400">{fmtBytes(doc.file_size_bytes ?? doc.file_size)}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {extractionStatus === 'extracted' && (
            <Link
              href={`/admin/documents/${doc.id}/map`}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              <Map className="w-4 h-4" /> Map Fields
            </Link>
          )}
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Open original
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: preview */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              {isPdf ? <FileText className="w-4 h-4 text-red-500" /> :
               isImage ? <FileImage className="w-4 h-4 text-blue-500" /> :
               <File className="w-4 h-4 text-slate-400" />}
              <span className="text-sm font-semibold text-slate-700">Preview</span>
            </div>
            <div className="p-4">
              {fileUrl && isPdf ? (
                <iframe
                  src={fileUrl}
                  className="w-full rounded-lg border border-slate-100"
                  style={{ height: 520 }}
                  title={name}
                />
              ) : fileUrl && isImage ? (
                <img
                  src={fileUrl}
                  alt={name}
                  className="w-full rounded-lg border border-slate-100 object-contain max-h-[520px]"
                />
              ) : fileUrl ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-slate-400">
                  <File className="w-10 h-10" />
                  <p className="text-sm">Preview not available for this file type.</p>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> Open file
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                  <AlertTriangle className="w-8 h-8" />
                  <p className="text-sm">No file URL available.</p>
                </div>
              )}
            </div>
          </div>

          {/* OCR text */}
          {ocrText && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-700">Extracted Text</span>
                {doc.ocr_confidence != null && (
                  <span className="ml-2 text-xs text-slate-400">
                    {Math.round(doc.ocr_confidence * 100)}% confidence
                  </span>
                )}
              </div>
              <pre className="p-4 text-xs text-slate-600 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto leading-relaxed">
                {ocrText}
              </pre>
            </div>
          )}
        </div>

        {/* Right: extraction + fields */}
        <div className="space-y-4">
          {/* Extraction panel */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Document Intelligence</span>
              <StatusBadge status={extractionStatus} />
            </div>
            <div className="p-5 space-y-4">
              {extractionStatus === 'extracted' ? (
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Extraction complete
                  {doc.processed_at && (
                    <span className="text-slate-400 text-xs ml-1">· {fmtDate(doc.processed_at)}</span>
                  )}
                </div>
              ) : extractionStatus === 'processing' ? (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing…
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Extract structured fields from this document using text parsing and OCR.
                  No data is sent to external services.
                </p>
              )}

              {extractError && (
                <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {extractError}
                </p>
              )}

              <button
                type="button"
                onClick={triggerExtraction}
                disabled={extracting || extractionStatus === 'processing'}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                {extracting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Extracting…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> {extractionStatus === 'extracted' ? 'Re-extract' : 'Extract fields'}</>
                )}
              </button>
            </div>
          </div>

          {/* Extracted fields */}
          {extractedFields.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  Extracted Fields ({extractedFields.length})
                </span>
                <Link
                  href={`/admin/documents/${doc.id}/map`}
                  className="text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1"
                >
                  Map to forms <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {extractedFields.map(([key, value]) => (
                  <div key={key} className="px-5 py-3 flex items-start gap-3">
                    <span className="text-xs font-mono text-slate-400 w-36 flex-shrink-0 pt-0.5">{key}</span>
                    <span className="text-sm text-slate-800 break-all">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing mappings */}
          {mappings.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-700">
                  Field Mappings ({mappings.length})
                </span>
              </div>
              <div className="divide-y divide-slate-50">
                {mappings.map((m) => (
                  <div key={m.id} className="px-5 py-3 flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 w-28 flex-shrink-0">{m.field_key}</span>
                    <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {m.target_table}.{m.target_column}
                    </span>
                    <span className="ml-auto">
                      {m.approved ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-700">Metadata</span>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4 text-sm">
              {[
                ['Type', doc.document_type || doc.mime_type || '—'],
                ['Size', fmtBytes(doc.file_size_bytes ?? doc.file_size)],
                ['Status', doc.status || '—'],
                ['Uploaded', fmtDate(doc.created_at)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="font-medium text-slate-800">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
