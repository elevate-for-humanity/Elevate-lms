'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FileText, Upload, Download, CheckCircle2, Clock,
  XCircle, AlertTriangle, Trash2, RefreshCw, Info,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

type DocType = {
  id: string;
  document_type: string;
  name: string;
  description: string | null;
  is_required: boolean;
  accepted_formats: string[];
  max_file_size_mb: number;
  display_order: number;
};

type UploadedDoc = {
  id: string;
  document_type_id: string | null;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  rejection_reason: string | null;
  uploaded_at: string;
  signed_url: string | null;
};

const STATUS_CONFIG = {
  pending:  { label: 'Under Review', icon: Clock,         cls: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approved',     icon: CheckCircle2,  cls: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected',     icon: XCircle,       cls: 'bg-red-100 text-red-800' },
  expired:  { label: 'Expired',      icon: AlertTriangle, cls: 'bg-slate-100 text-slate-600' },
};

function StatusBadge({ status }: { status: UploadedDoc['status'] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

function formatBytes(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsClient() {
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [uploaded, setUploaded] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Upload state per document type
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadError, setUploadError] = useState<Record<string, string>>({});
  const [uploadSuccess, setUploadSuccess] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Delete state
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/apprentice/documents?program=barber-apprenticeship');
      if (!res.ok) throw new Error('Failed to load documents');
      const data = await res.json();
      setDocTypes(data.documentTypes ?? []);
      setUploaded(data.uploadedDocuments ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Map uploaded docs by document_type for quick lookup
  const uploadedByType: Record<string, UploadedDoc> = {};
  for (const doc of uploaded) {
    uploadedByType[doc.document_type] = doc;
  }

  const handleFileSelect = async (docType: DocType, file: File) => {
    const typeId = docType.id;
    setUploadError(p => ({ ...p, [typeId]: '' }));
    setUploadSuccess(p => ({ ...p, [typeId]: false }));

    // Client-side validation
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!docType.accepted_formats.includes(ext)) {
      setUploadError(p => ({
        ...p,
        [typeId]: `Invalid file type. Accepted: ${docType.accepted_formats.join(', ').toUpperCase()}`,
      }));
      return;
    }
    if (file.size > docType.max_file_size_mb * 1024 * 1024) {
      setUploadError(p => ({
        ...p,
        [typeId]: `File too large. Maximum: ${docType.max_file_size_mb} MB`,
      }));
      return;
    }

    setUploading(p => ({ ...p, [typeId]: true }));

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('documentTypeId', typeId);
      form.append('programSlug', 'barber-apprenticeship');

      const res = await fetch('/api/apprentice/documents', { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok) {
        setUploadError(p => ({ ...p, [typeId]: data.error ?? 'Upload failed' }));
        return;
      }

      setUploadSuccess(p => ({ ...p, [typeId]: true }));
      await load(); // Refresh list
    } catch {
      setUploadError(p => ({ ...p, [typeId]: 'Upload failed. Please try again.' }));
    } finally {
      setUploading(p => ({ ...p, [typeId]: false }));
      // Reset file input
      if (fileInputRefs.current[typeId]) {
        fileInputRefs.current[typeId]!.value = '';
      }
    }
  };

  const handleDelete = async (doc: UploadedDoc) => {
    if (!confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) return;
    setDeleting(p => ({ ...p, [doc.id]: true }));
    try {
      const res = await fetch(`/api/apprentice/documents?id=${doc.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? 'Delete failed');
        return;
      }
      await load();
    } finally {
      setDeleting(p => ({ ...p, [doc.id]: false }));
    }
  };

  const required = docTypes.filter(d => d.is_required);
  const optional = docTypes.filter(d => !d.is_required);
  const requiredComplete = required.filter(d => uploadedByType[d.document_type]?.status === 'approved').length;
  const requiredTotal = required.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-blue-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading documents…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Apprentice Portal', href: '/apprentice' },
            { label: 'Documents' },
          ]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Required Documents</h1>
            <p className="text-slate-500 text-sm mt-1">
              Indiana Barber Apprenticeship — upload all required documents to complete enrollment
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Progress bar */}
        {requiredTotal > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">Required Documents</span>
              <span className="text-sm text-slate-500">{requiredComplete} of {requiredTotal} approved</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className="bg-brand-blue-600 h-2.5 rounded-full transition-all"
                style={{ width: `${requiredTotal > 0 ? (requiredComplete / requiredTotal) * 100 : 0}%` }}
              />
            </div>
            {requiredComplete < requiredTotal && (
              <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                All required documents must be approved before your apprenticeship can be activated in RAPIDS.
              </p>
            )}
          </div>
        )}

        {/* No doc types loaded */}
        {docTypes.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Document list not yet configured</p>
              <p className="text-sm text-amber-700 mt-1">
                Ask your program administrator to apply migration{' '}
                <code className="font-mono text-xs bg-amber-100 px-1 rounded">20260527000003_apprentice_document_system.sql</code>{' '}
                in the Supabase Dashboard.
              </p>
            </div>
          </div>
        )}

        {/* Required documents */}
        {required.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Required ({required.length})
            </h2>
            <div className="space-y-3">
              {required.map(dt => (
                <DocRow
                  key={dt.id}
                  docType={dt}
                  existing={uploadedByType[dt.document_type] ?? null}
                  uploading={uploading[dt.id] ?? false}
                  uploadError={uploadError[dt.id] ?? ''}
                  uploadSuccess={uploadSuccess[dt.id] ?? false}
                  deleting={deleting}
                  fileInputRef={(el) => { fileInputRefs.current[dt.id] = el; }}
                  onFileSelect={(f) => handleFileSelect(dt, f)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        )}

        {/* Optional documents */}
        {optional.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Optional / Conditional ({optional.length})
            </h2>
            <div className="space-y-3">
              {optional.map(dt => (
                <DocRow
                  key={dt.id}
                  docType={dt}
                  existing={uploadedByType[dt.document_type] ?? null}
                  uploading={uploading[dt.id] ?? false}
                  uploadError={uploadError[dt.id] ?? ''}
                  uploadSuccess={uploadSuccess[dt.id] ?? false}
                  deleting={deleting}
                  fileInputRef={(el) => { fileInputRefs.current[dt.id] = el; }}
                  onFileSelect={(f) => handleFileSelect(dt, f)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        )}

        {/* Quick links */}
        <div className="mt-10 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 text-sm mb-3">Quick Links</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/apprentice/handbook" className="text-brand-blue-600 hover:underline">Apprentice Handbook</Link>
            <Link href="/apprentice/hours" className="text-brand-blue-600 hover:underline">Log Hours</Link>
            <Link href="/apprentice/competencies" className="text-brand-blue-600 hover:underline">Competency Progress</Link>
            <Link href="/apprentice/transfer-hours" className="text-brand-blue-600 hover:underline">Transfer Hours</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DocRow component ─────────────────────────────────────────────────────────
function DocRow({
  docType,
  existing,
  uploading,
  uploadError,
  uploadSuccess,
  deleting,
  fileInputRef,
  onFileSelect,
  onDelete,
}: {
  docType: DocType;
  existing: UploadedDoc | null;
  uploading: boolean;
  uploadError: string;
  uploadSuccess: boolean;
  deleting: Record<string, boolean>;
  fileInputRef: (el: HTMLInputElement | null) => void;
  onFileSelect: (f: File) => void;
  onDelete: (doc: UploadedDoc) => void;
}) {
  const hasApproved = existing?.status === 'approved';
  const hasPending  = existing?.status === 'pending';
  const hasRejected = existing?.status === 'rejected';

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 ${
      hasApproved ? 'border-green-200' :
      hasRejected ? 'border-red-200' :
      hasPending  ? 'border-amber-200' :
      'border-slate-200'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
            hasApproved ? 'bg-green-100' : hasPending ? 'bg-amber-100' : hasRejected ? 'bg-red-100' : 'bg-slate-100'
          }`}>
            <FileText className={`w-5 h-5 ${
              hasApproved ? 'text-green-600' : hasPending ? 'text-amber-600' : hasRejected ? 'text-red-600' : 'text-slate-400'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-slate-900 text-sm">{docType.name}</p>
              {docType.is_required && (
                <span className="text-xs text-red-600 font-medium">Required</span>
              )}
              {existing && <StatusBadge status={existing.status} />}
            </div>
            {docType.description && (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{docType.description}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              Accepted: {docType.accepted_formats.map(f => f.toUpperCase()).join(', ')} · Max {docType.max_file_size_mb} MB
            </p>

            {/* Existing file info */}
            {existing && (
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <span className="text-xs text-slate-600 font-medium truncate max-w-xs">
                  {existing.file_name}
                  {existing.file_size_bytes ? ` (${formatBytes(existing.file_size_bytes)})` : ''}
                </span>
                <span className="text-xs text-slate-400">
                  Uploaded {new Date(existing.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                {existing.signed_url && (
                  <a
                    href={existing.signed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand-blue-600 hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" /> View
                  </a>
                )}
              </div>
            )}

            {/* Rejection reason */}
            {existing?.status === 'rejected' && existing.rejection_reason && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <strong>Reason:</strong> {existing.rejection_reason}
              </div>
            )}

            {/* Upload error */}
            {uploadError && (
              <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> {uploadError}
              </p>
            )}

            {/* Upload success */}
            {uploadSuccess && !uploadError && (
              <p className="mt-2 text-xs text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded — pending review
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Delete button — only for non-approved */}
          {existing && existing.status !== 'approved' && (
            <button
              onClick={() => onDelete(existing)}
              disabled={deleting[existing.id]}
              className="p-1.5 text-slate-400 hover:text-red-600 transition disabled:opacity-50"
              title="Delete document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Upload button — hidden if approved */}
          {!hasApproved && (
            <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
              uploading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : existing
                ? 'bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100'
                : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
            }`}>
              {uploading ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
              ) : existing ? (
                <><Upload className="w-3.5 h-3.5" /> Replace</>
              ) : (
                <><Upload className="w-3.5 h-3.5" /> Upload</>
              )}
              <input
                type="file"
                className="sr-only"
                disabled={uploading}
                accept={docType.accepted_formats.map(f => `.${f}`).join(',')}
                ref={fileInputRef}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) onFileSelect(f);
                }}
              />
            </label>
          )}

          {/* Approved checkmark */}
          {hasApproved && (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          )}
        </div>
      </div>
    </div>
  );
}
