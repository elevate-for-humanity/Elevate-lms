'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, FileText, Loader2, Sparkles, CheckCircle2,
  AlertTriangle, ChevronRight, PenLine, Download, ExternalLink,
  Clock, List,
} from 'lucide-react';

type Field = {
  id: string;
  label: string;
  field_key: string;
  field_type: string;
  required: boolean;
  context_snippet: string | null;
  confidence: number | null;
  sort_order: number;
};

type PrefillRun = {
  id: string;
  status: string;
  response_style: string;
  created_at: string;
  matched_values: Record<string, string> | null;
  missing_values: Record<string, string> | null;
  approved_values: Record<string, string> | null;
  field_metadata: Record<string, { source: string; ai_drafted: boolean; label: string }> | null;
};

type Contract = {
  id: string;
  title: string;
  agency_name: string | null;
  source_type: string;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  status: string;
  extraction_method: string | null;
  page_count: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contract_template_fields: Field[];
  contract_prefill_runs: PrefillRun[];
};

const SOURCE_LABELS: Record<string, string> = {
  state_contract: 'State Contract', grant_application: 'Grant Application',
  mou: 'MOU', rfp: 'RFP', rfq: 'RFQ', compliance_form: 'Compliance Form', other: 'Other',
};

const STYLE_LABELS: Record<string, string> = {
  state_contract_formal: 'State Contract (Formal)',
  grant_persuasive: 'Grant (Persuasive)',
  agency_compliance: 'Agency Compliance',
  workforce_development: 'Workforce Development',
  partner_mou: 'Partner MOU',
  budget_justification: 'Budget Justification',
  executive_summary: 'Executive Summary',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtBytes(n: number | null) {
  if (!n) return '—';
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ContractDetailClient({
  contract,
  previewUrl,
}: {
  contract: Contract;
  previewUrl: string | null;
}) {
  const [status, setStatus] = useState(contract.status);
  const [fields, setFields] = useState<Field[]>(contract.contract_template_fields ?? []);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [prefilling, setPrefilling] = useState(false);
  const [prefillError, setPrefillError] = useState<string | null>(null);
  const [prefillRuns, setPrefillRuns] = useState<PrefillRun[]>(contract.contract_prefill_runs ?? []);
  const [responseStyle, setResponseStyle] = useState<string>('state_contract_formal');

  const isPdf = contract.file_type?.includes('pdf');
  const latestRun = prefillRuns[0];

  async function runExtraction() {
    setExtracting(true);
    setExtractError(null);
    try {
      const res = await fetch('/api/admin/contracts/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_id: contract.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setStatus('extracted');
      setFields(data.fields ?? []);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  }

  async function runPrefill() {
    setPrefilling(true);
    setPrefillError(null);
    try {
      const res = await fetch('/api/admin/contracts/prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_id: contract.id, response_style: responseStyle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setStatus('review');
      // Redirect to prefill review page
      window.location.href = `/admin/contracts/${contract.id}/prefill?run=${data.run_id}`;
    } catch (err) {
      setPrefillError(err instanceof Error ? err.message : 'Prefill failed');
    } finally {
      setPrefilling(false);
    }
  }

  const canExtract = ['uploaded', 'extracted'].includes(status);
  const canPrefill = ['extracted', 'review'].includes(status);
  const canSign = status === 'approved' || (latestRun?.status === 'approved');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <Link href="/admin/contracts" className="hover:text-slate-700 flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Contracts
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium truncate max-w-[240px]">{contract.title}</span>
        </nav>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{contract.title}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-slate-500">
              {contract.agency_name && <span>{contract.agency_name}</span>}
              <span>·</span>
              <span>{SOURCE_LABELS[contract.source_type] ?? contract.source_type}</span>
              <span>·</span>
              <span>{fmtBytes(contract.file_size)}</span>
              <span>·</span>
              <span>{fmtDate(contract.created_at)}</span>
            </div>
          </div>
          {/* Action buttons based on status */}
          <div className="flex gap-2 flex-wrap">
            {canSign && latestRun && (
              <Link
                href={`/admin/contracts/${contract.id}/sign?run=${latestRun.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 transition-colors"
              >
                <PenLine className="w-4 h-4" /> Sign
              </Link>
            )}
            {latestRun && (
              <Link
                href={`/admin/contracts/${contract.id}/prefill?run=${latestRun.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <List className="w-4 h-4" /> Review fields
              </Link>
            )}
            {latestRun?.status === 'approved' && (
              <Link
                href={`/admin/contracts/${contract.id}/export?run=${latestRun.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4" /> Export
              </Link>
            )}
            {previewUrl && (
              <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                <ExternalLink className="w-4 h-4" /> Open original
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: preview */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-slate-700">Document Preview</span>
            </div>
            <div className="p-4">
              {previewUrl && isPdf ? (
                <iframe src={previewUrl} className="w-full rounded-lg border border-slate-100" style={{ height: 560 }} title={contract.title} />
              ) : previewUrl ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-slate-400">
                  <FileText className="w-10 h-10" />
                  <p className="text-sm">Preview not available for this file type.</p>
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors">
                    <ExternalLink className="w-4 h-4" /> Open file
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                  <AlertTriangle className="w-8 h-8" />
                  <p className="text-sm">Preview unavailable — file URL expired or not yet generated.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: pipeline */}
        <div className="space-y-4">
          {/* Step 1: Extract */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-xs font-bold">1</span>
                <span className="text-sm font-semibold text-slate-700">Extract Fields</span>
              </div>
              {fields.length > 0 && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {fields.length} fields detected
                </span>
              )}
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-500">
                Detect blank fields, signature lines, checkboxes, and required sections from the uploaded document.
                {contract.extraction_method && (
                  <span className="ml-1 text-slate-400">Method: {contract.extraction_method}</span>
                )}
              </p>
              {extractError && (
                <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{extractError}</p>
              )}
              <button
                onClick={runExtraction}
                disabled={extracting || !canExtract}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                {extracting ? <><Loader2 className="w-4 h-4 animate-spin" /> Extracting…</> :
                  fields.length > 0 ? 'Re-extract' : 'Extract fields'}
              </button>
            </div>

            {/* Detected fields list */}
            {fields.length > 0 && (
              <div className="border-t border-slate-100 divide-y divide-slate-50 max-h-48 overflow-y-auto">
                {fields.map(f => (
                  <div key={f.id} className="px-5 py-2.5 flex items-center gap-3">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.required ? 'bg-red-400' : 'bg-slate-300'}`} />
                    <span className="text-xs font-medium text-slate-700 flex-1">{f.label}</span>
                    <span className="text-xs text-slate-400 font-mono">{f.field_type}</span>
                    {f.confidence != null && (
                      <span className="text-xs text-slate-400">{Math.round(f.confidence * 100)}%</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Prefill */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-xs font-bold">2</span>
              <span className="text-sm font-semibold text-slate-700">Prefill from Org Data</span>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-500">
                Pull verified facts from your organization profile. Generate humanized narrative drafts for open-ended fields.
                All AI-drafted content is flagged for your review.
              </p>
              <label className="block">
                <span className="text-xs font-medium text-slate-600">Response style</span>
                <select
                  value={responseStyle}
                  onChange={e => setResponseStyle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {Object.entries(STYLE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>
              {prefillError && (
                <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{prefillError}</p>
              )}
              <button
                onClick={runPrefill}
                disabled={prefilling || !canPrefill}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                {prefilling ? <><Loader2 className="w-4 h-4 animate-spin" /> Prefilling…</> :
                  <><Sparkles className="w-4 h-4" /> Run prefill</>}
              </button>
            </div>
          </div>

          {/* Previous runs */}
          {prefillRuns.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-700">Prefill Runs</span>
              </div>
              <div className="divide-y divide-slate-50">
                {prefillRuns.map(run => {
                  const approved = Object.keys(run.approved_values ?? {}).length;
                  const missing = Object.keys(run.missing_values ?? {}).length;
                  return (
                    <Link
                      key={run.id}
                      href={`/admin/contracts/${contract.id}/prefill?run=${run.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group"
                    >
                      <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700">
                          {STYLE_LABELS[run.response_style] ?? run.response_style}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {fmtDate(run.created_at)} · {approved} approved · {missing} missing
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        run.status === 'approved' ? 'bg-green-100 text-green-700' :
                        run.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                        'bg-amber-100 text-amber-700'
                      }`}>{run.status}</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Steps 3-5 */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
            {[
              { step: 3, label: 'Review & approve each field', href: latestRun ? `/admin/contracts/${contract.id}/prefill?run=${latestRun.id}` : null, active: !!latestRun },
              { step: 4, label: 'Sign the document', href: canSign && latestRun ? `/admin/contracts/${contract.id}/sign?run=${latestRun.id}` : null, active: canSign },
              { step: 5, label: 'Export final document', href: latestRun?.status === 'approved' ? `/admin/contracts/${contract.id}/export?run=${latestRun.id}` : null, active: latestRun?.status === 'approved' },
            ].map(({ step, label, href, active }) => (
              <div key={step} className="flex items-center gap-3">
                <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${
                  active ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'
                }`}>{step}</span>
                {href ? (
                  <Link href={href} className="text-sm text-slate-700 hover:text-slate-900 hover:underline">{label}</Link>
                ) : (
                  <span className="text-sm text-slate-400">{label}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
