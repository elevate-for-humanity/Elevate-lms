'use client';

import React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Upload, FileText, File, ChevronRight, Loader2,
  CheckCircle2, AlertTriangle, Clock, Archive,
  PenLine, Download, Sparkles, Plus, X,
} from 'lucide-react';

type ContractTemplate = {
  id: string;
  title: string;
  agency_name: string | null;
  source_type: string;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  status: string;
  created_at: string;
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  state_contract:    'State Contract',
  grant_application: 'Grant Application',
  mou:               'MOU',
  rfp:               'RFP',
  rfq:               'RFQ',
  compliance_form:   'Compliance Form',
  other:             'Other',
};

const STATUS_CONFIG: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
  uploaded:   { label: 'Uploaded',   cls: 'bg-slate-100 text-slate-600',  Icon: Clock },
  extracting: { label: 'Extracting', cls: 'bg-amber-100 text-amber-700',  Icon: Loader2 },
  extracted:  { label: 'Extracted',  cls: 'bg-blue-100 text-blue-700',    Icon: CheckCircle2 },
  prefilling: { label: 'Prefilling', cls: 'bg-purple-100 text-purple-700',Icon: Sparkles },
  review:     { label: 'In Review',  cls: 'bg-yellow-100 text-yellow-700',Icon: PenLine },
  approved:   { label: 'Approved',   cls: 'bg-green-100 text-green-700',  Icon: CheckCircle2 },
  signed:     { label: 'Signed',     cls: 'bg-green-100 text-green-800',  Icon: PenLine },
  exported:   { label: 'Exported',   cls: 'bg-teal-100 text-teal-700',    Icon: Download },
  archived:   { label: 'Archived',   cls: 'bg-slate-100 text-slate-400',  Icon: Archive },
};

const ACCEPTED = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv';
const ACCEPTED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
]);

function fmtBytes(n: number | null) {
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type StatusBadgeConfig = { label: string; cls: string; Icon: React.ElementType };

function StatusBadge({ status }: { status: string }) {
  const cfg: StatusBadgeConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG['uploaded'] as StatusBadgeConfig;
  const { label, cls, Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export default function ContractsClient() {
  const supabase = useMemo(() => createClient(), []);
  const inputRef = useRef<HTMLInputElement>(null);

  const [contracts, setContracts] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Upload form state
  const [title, setTitle] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [sourceType, setSourceType] = useState('state_contract');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('contract_templates')
      .select('id,title,agency_name,source_type,file_name,file_type,file_size,status,created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    setContracts(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const handleFile = (file: File) => {
    if (!ACCEPTED_MIME.has(file.type)) {
      setUploadError(`Unsupported file type: ${file.type || 'unknown'}`);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File exceeds 50 MB limit');
      return;
    }
    setSelectedFile(file);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
    setUploadError(null);
  };

  const submitUpload = async () => {
    if (!selectedFile) { setUploadError('Select a file first'); return; }
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const fd = new FormData();
    fd.append('file', selectedFile);
    fd.append('title', title.trim() || selectedFile.name);
    fd.append('agency_name', agencyName.trim());
    fd.append('source_type', sourceType);

    try {
      const res = await fetch('/api/admin/contracts/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setUploadSuccess(`"${data.template.title}" uploaded. Click Extract to detect fields.`);
      setShowUpload(false);
      setSelectedFile(null);
      setTitle('');
      setAgencyName('');
      setSourceType('state_contract');
      await load();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contract Automation</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload state contracts, grant templates, and MOUs. Extract fields, prefill from org data, review, sign, and export.
          </p>
        </div>
        <button
          onClick={() => { setShowUpload(true); setUploadError(null); setUploadSuccess(null); }}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Upload template
        </button>
      </div>

      {uploadSuccess && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center justify-between">
          <span>{uploadSuccess}</span>
          <button onClick={() => setUploadSuccess(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Upload panel */}
      {showUpload && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Upload Contract Template</h2>
            <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Title</span>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. WIOA Title I Subgrant Agreement"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Agency</span>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                value={agencyName}
                onChange={e => setAgencyName(e.target.value)}
                placeholder="e.g. Indiana DWD"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Document type</span>
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                value={sourceType}
                onChange={e => setSourceType(e.target.value)}
              >
                {Object.entries(SOURCE_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Drop zone */}
          <div
            className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
              dragging ? 'border-slate-700 bg-slate-50' : 'border-slate-300 hover:border-slate-400'
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <input ref={inputRef} type="file" className="hidden" accept={ACCEPTED}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-6 h-6 text-slate-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">{fmtBytes(selectedFile.size)}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); setSelectedFile(null); }}
                  className="ml-2 text-slate-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="mx-auto w-8 h-8 text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-700">Drop file here or click to browse</p>
                <p className="text-xs text-slate-400 mt-1">PDF, Word, Excel, CSV, TXT — max 50 MB</p>
              </>
            )}
          </div>

          {uploadError && (
            <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{uploadError}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={submitUpload}
              disabled={uploading || !selectedFile}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload</>}
            </button>
            <button onClick={() => setShowUpload(false)}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Contracts list */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Templates</h2>
          <span className="text-xs text-slate-400">{contracts.length} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <File className="w-10 h-10" />
            <p className="text-sm">No contract templates yet. Upload one to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {contracts.map(c => (
              <Link
                key={c.id}
                href={`/admin/contracts/${c.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group"
              >
                <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{c.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {c.agency_name && (
                      <span className="text-xs text-slate-500">{c.agency_name}</span>
                    )}
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-xs text-slate-400">
                      {SOURCE_TYPE_LABELS[c.source_type] ?? c.source_type}
                    </span>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-xs text-slate-400">{fmtBytes(c.file_size)}</span>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-xs text-slate-400">{fmtDate(c.created_at)}</span>
                  </div>
                </div>
                <StatusBadge status={c.status} />
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Workflow guide */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Workflow</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          {['Upload', 'Extract fields', 'Prefill from org data', 'Review & approve', 'Sign', 'Export'].map((step, i, arr) => (
            <span key={step} className="flex items-center gap-2">
              <span className="rounded-full bg-white border border-slate-200 px-2.5 py-1 font-medium">{step}</span>
              {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Only admin-approved fields are written into the final document. Signatures require all required fields to be approved first.
        </p>
      </div>
    </div>
  );
}
