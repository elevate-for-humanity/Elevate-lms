'use client';

import { useState } from 'react';
import type { AuditReport, AuditFinding, AuditSeverity } from '@/lib/audit/site-audit';

const SEVERITY_STYLES: Record<AuditSeverity, string> = {
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
};

const SEVERITY_BADGE: Record<AuditSeverity, string> = {
  error: 'bg-red-100 text-red-700 font-semibold',
  warning: 'bg-yellow-100 text-yellow-700 font-semibold',
  info: 'bg-blue-100 text-blue-600',
};

const CATEGORY_LABELS: Record<string, string> = {
  'duplicate-route': 'Duplicate Routes',
  'schema-violation': 'Schema Violations',
  'missing-auth': 'Missing Auth Guards',
  'console-log': 'Console Logs',
  'orphaned-stub': 'Orphaned Stubs',
};

function FindingRow({ f }: { f: AuditFinding }) {
  return (
    <div className={`border rounded px-3 py-2 text-sm ${SEVERITY_STYLES[f.severity]}`}>
      <div className="flex items-start gap-2">
        <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${SEVERITY_BADGE[f.severity]}`}>
          {f.severity}
        </span>
        <div className="min-w-0">
          <span className="font-mono text-xs opacity-70 break-all">{f.file}{f.line ? `:${f.line}` : ''}</span>
          <p className="mt-0.5">{f.message}</p>
        </div>
      </div>
    </div>
  );
}

export default function SiteAuditPage() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  async function runAudit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/site-audit');
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setReport(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Audit failed');
    } finally {
      setLoading(false);
    }
  }

  const categories = report
    ? Array.from(new Set(report.findings.map(f => f.category)))
    : [];

  const filtered = report?.findings.filter(
    f => filter === 'all' || f.category === filter || f.severity === filter
  ) ?? [];

  const errorCount = report?.summary.error ?? 0;
  const warnCount = report?.summary.warning ?? 0;
  const infoCount = report?.summary.info ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Audit</h1>
          <p className="text-sm text-gray-500 mt-1">
            Static analysis: duplicate routes, schema violations, missing auth guards, console logs
          </p>
        </div>
        <button
          onClick={runAudit}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Scanning…' : 'Run Audit'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {report && (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Files scanned', value: report.totalFiles, color: 'text-gray-700' },
              { label: 'Errors', value: errorCount, color: 'text-red-600 font-bold' },
              { label: 'Warnings', value: warnCount, color: 'text-yellow-600 font-bold' },
              { label: 'Info', value: infoCount, color: 'text-blue-600' },
            ].map(s => (
              <div key={s.label} className="bg-white border rounded-lg px-4 py-3">
                <div className={`text-2xl ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Category breakdown */}
          <div className="bg-white border rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">By Category</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${filter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
              >
                All ({report.findings.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${filter === cat ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                >
                  {CATEGORY_LABELS[cat] ?? cat} ({report.summary[cat] ?? 0})
                </button>
              ))}
            </div>
          </div>

          {/* Findings list */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No findings in this category</div>
            ) : (
              filtered.map((f, i) => <FindingRow key={i} f={f} />)
            )}
          </div>

          <p className="text-xs text-gray-400 text-right">
            Scanned in {report.durationMs}ms · {report.runAt}
          </p>
        </>
      )}

      {!report && !loading && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">Click &ldquo;Run Audit&rdquo; to scan the codebase</p>
          <p className="text-sm mt-1">Checks duplicate routes, schema violations, missing auth guards, and more</p>
        </div>
      )}
    </div>
  );
}
