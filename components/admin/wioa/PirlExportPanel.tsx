'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ── Types matching live wioa_pirl_exports schema + new columns ────────────────

interface PirlExport {
  id: string;
  schema_id: string;
  quarter: string;
  fiscal_year: number;
  status: string | null;
  record_count: number | null;
  error_count: number | null;
  warning_count: number | null;
  file_url: string | null;
  checksum_sha256: string | null;
  errors: Record<string, unknown> | null;
  report_json: Record<string, unknown> | null;
  exported_by: string | null;
  exported_at: string | null;
  created_at: string | null;
}

interface RunResult {
  export_id: string;
  quarter: string;
  record_count: number;
  error_count: number;
  warning_count: number;
  checksum: string;
  file_url: string | null;
  status: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function currentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}Q${q}`;
}

function quarterOptions(): string[] {
  const opts: string[] = [];
  const now = new Date();
  for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) {
    for (let q = 4; q >= 1; q--) {
      if (y === now.getFullYear() && q > Math.ceil((now.getMonth() + 1) / 3)) continue;
      opts.push(`${y}Q${q}`);
    }
  }
  return opts;
}

const STATUS_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  completed: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-emerald-600',
    label: 'Completed',
  },
  failed: {
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-red-600',
    label: 'Failed',
  },
  running: {
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    color: 'text-blue-600',
    label: 'Running',
  },
  pending: {
    icon: <Clock className="w-4 h-4" />,
    color: 'text-amber-600',
    label: 'Pending',
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PirlExportPanel() {
  const [quarter, setQuarter] = useState(currentQuarter);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<PirlExport[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/admin/wioa/pirl-export');
      if (res.ok) {
        const json = await res.json() as { exports: PirlExport[] };
        setHistory(json.exports ?? []);
      }
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function runExport() {
    setRunning(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/admin/wioa/pirl-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quarter }),
      });

      const json = await res.json() as RunResult & { error?: string };

      if (!res.ok) {
        setError(json.error ?? 'Export failed');
      } else {
        setResult(json);
        await loadHistory();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            PIRL Export — ETA-9170
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generates the DOL fixed-width WIOA participant file for quarterly submission.
            Requires <code className="bg-slate-100 px-1 rounded">wioa_participants</code> rows
            with <code className="bg-slate-100 px-1 rounded">eligibility_status = &apos;verified&apos;</code>.
          </p>
        </div>
        <button
          onClick={loadHistory}
          disabled={loadingHistory}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Run panel */}
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Quarter
            </label>
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              disabled={running}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            >
              {quarterOptions().map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>

          <button
            onClick={runExport}
            disabled={running}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50 transition"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run PIRL export
              </>
            )}
          </button>

          {running && (
            <p className="text-xs text-slate-500 self-center">
              This may take 30–60 seconds for large cohorts.
            </p>
          )}
        </div>

        {/* Inline result */}
        {result && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">
                Export complete — {result.quarter}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
              <div>
                <span className="text-slate-500 block">Records</span>
                <span className="font-bold text-slate-800">{result.record_count.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Errors</span>
                <span className={`font-bold ${result.error_count > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {result.error_count}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Warnings</span>
                <span className={`font-bold ${result.warning_count > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                  {result.warning_count}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">SHA-256</span>
                <span className="font-mono text-slate-600 truncate block max-w-7xl" title={result.checksum}>
                  {result.checksum?.slice(0, 12)}…
                </span>
              </div>
            </div>
            {result.file_url && (
              <a
                href={result.file_url}
                download
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                Download .txt file
              </a>
            )}
            {result.error_count > 0 && (
              <p className="mt-2 text-xs text-amber-700">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                {result.error_count} validation error{result.error_count !== 1 ? 's' : ''} — review
                the validation report before submitting to DOL.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <XCircle className="w-4 h-4 inline mr-1.5" />
            {error}
          </div>
        )}
      </div>

      {/* History */}
      <div className="px-6 py-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Export history
        </h3>

        {loadingHistory ? (
          <div className="py-6 text-center text-slate-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Loading…
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No exports yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((exp) => {
              const meta = STATUS_META[exp.status ?? 'pending'] ?? STATUS_META.pending;
              const isExpanded = expandedId === exp.id;
              const report = exp.report_json ?? exp.errors;

              return (
                <div key={exp.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* Row */}
                  <div className="flex items-center justify-between px-4 py-3 gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className={meta.color}>{meta.icon}</span>
                      <div>
                        <span className="font-semibold text-sm text-slate-800">{exp.quarter}</span>
                        <span className="text-xs text-slate-400 ml-2">{exp.schema_id}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        exp.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        exp.status === 'failed'    ? 'bg-red-100 text-red-700' :
                        exp.status === 'running'   ? 'bg-blue-100 text-blue-700' :
                                                     'bg-slate-100 text-slate-600'
                      }`}>
                        {meta.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {exp.record_count != null && (
                        <span>{exp.record_count.toLocaleString()} records</span>
                      )}
                      {(exp.error_count ?? 0) > 0 && (
                        <span className="text-red-600 font-medium">
                          {exp.error_count} errors
                        </span>
                      )}
                      {(exp.warning_count ?? 0) > 0 && (
                        <span className="text-amber-600">
                          {exp.warning_count} warnings
                        </span>
                      )}
                      {exp.exported_at && (
                        <span>{new Date(exp.exported_at).toLocaleDateString()}</span>
                      )}
                      <div className="flex items-center gap-2">
                        {exp.file_url && (
                          <a
                            href={exp.file_url}
                            download
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium transition"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        )}
                        {report && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 transition"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            Report
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded validation report */}
                  {isExpanded && report && (
                    <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
                      {/* Summary */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                        {(['recordCount','errorCount','warningCount'] as const).map((k) => (
                          (report as Record<string, unknown>)[k] != null && (
                            <div key={k}>
                              <span className="text-slate-400 block capitalize">
                                {k.replace(/([A-Z])/g, ' $1').toLowerCase()}
                              </span>
                              <span className="font-bold text-slate-700">
                                {String((report as Record<string, unknown>)[k])}
                              </span>
                            </div>
                          )
                        ))}
                        {exp.checksum_sha256 && (
                          <div>
                            <span className="text-slate-400 block">SHA-256</span>
                            <span className="font-mono text-slate-600 text-xs truncate block" title={exp.checksum_sha256}>
                              {exp.checksum_sha256.slice(0, 16)}…
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Top errors */}
                      {Array.isArray((report as Record<string, unknown>).topErrors) &&
                        ((report as Record<string, unknown>).topErrors as unknown[]).length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-red-700 mb-1.5">
                            Top validation errors
                          </p>
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {((report as Record<string, unknown>).topErrors as Array<{
                              participantId: string;
                              element: string;
                              fieldName: string;
                              message: string;
                              value: unknown;
                            }>).slice(0, 20).map((issue, i) => (
                              <div key={i} className="text-xs bg-red-50 border border-red-100 rounded px-2 py-1.5">
                                <span className="font-mono text-red-600 mr-1.5">
                                  [{issue.element}] {issue.fieldName}
                                </span>
                                <span className="text-slate-600">{issue.message}</span>
                                {issue.value != null && (
                                  <span className="text-slate-400 ml-1">
                                    (got: <code>{String(issue.value)}</code>)
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Issues by element */}
                      {(report as Record<string, unknown>).issuesByElement && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-slate-500 hover:text-slate-700 font-medium">
                            Issues by element
                          </summary>
                          <pre className="mt-2 bg-white border border-slate-200 rounded p-2 overflow-x-auto text-slate-600 text-xs max-h-40">
                            {JSON.stringify((report as Record<string, unknown>).issuesByElement, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
