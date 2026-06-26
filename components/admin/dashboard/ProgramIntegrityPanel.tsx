'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ShieldCheck, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';

interface ProgramRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  category: string | null;
  published: boolean;
  integrity_score: number;
  total_lessons: number;
  total_modules: number;
  active_enrollments: number;
  failing_checks: string[];
}

interface ApiResponse {
  programs: ProgramRow[];
  pending_migration?: boolean;
  source?: 'view' | 'fallback';
  fallback_reason?: string;
}

const FAILING_CHECK_LABELS: Record<string, string> = {
  no_lessons: 'No lessons',
  no_modules: 'No modules',
  no_course_row: 'No course row',
  no_completion_rule: 'No completion rule',
  no_title: 'No title',
  bad_slug: 'Bad slug',
  no_category: 'No category',
  not_published: 'Not published',
  no_enrollments: 'No enrollments',
  no_description: 'No description',
};

function scoreColor(score: number): string {
  if (score >= 80) return 'text-brand-green-600 bg-brand-green-50';
  if (score >= 60) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
}

function scoreBadge(score: number): string {
  if (score >= 80) return 'bg-brand-green-100 text-brand-green-700';
  if (score >= 60) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

export function ProgramIntegrityPanel() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch programs with score < 100 (anything with at least one failing check)
      const res = await fetch('/api/admin/program-integrity?limit=12&min=60', {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch {
      setError('Could not load program integrity data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const programs = data?.programs ?? [];
  const critical = programs.filter((p) => p.integrity_score < 60);
  const warning = programs.filter((p) => p.integrity_score >= 60 && p.integrity_score < 80);
  const visible = showAll ? programs : programs.slice(0, 8);

  return (
    <div className="rounded-xl border border-slate-200 bg-white mb-6">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-900">Program Integrity</h2>
          {!loading && data && (
            <div className="flex items-center gap-1.5 ml-1">
              {critical.length > 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  {critical.length} critical
                </span>
              )}
              {warning.length > 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {warning.length} warning
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/admin/programs"
            className="text-xs font-semibold text-brand-blue-600 hover:underline flex items-center gap-1"
          >
            All programs <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {data?.source === 'fallback' && (
        <div className="border-b border-amber-100 bg-amber-50 px-6 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Live fallback audit active</p>
            <p className="text-xs text-amber-800 mt-0.5">
              The database view is not available, so the dashboard computed integrity from live program, module, lesson, enrollment, certificate, and completion-rule tables.
            </p>
          </div>
        </div>
      )}

      {error ? (
        <div className="px-6 py-4 text-sm text-red-600">{error}</div>
      ) : loading && !data ? (
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 sm:px-6 py-3">
              <div className="h-4 bg-slate-100 rounded animate-pulse w-48" />
              <div className="h-5 bg-slate-100 rounded-full animate-pulse w-10" />
            </div>
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="px-6 py-5 text-sm text-slate-500">
          All programs pass integrity checks.
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-100">
            {visible.map((p) => (
              <Link
                key={p.id}
                href={`/admin/programs/${p.id}`}
                className="flex items-start justify-between px-4 sm:px-6 py-3 hover:bg-slate-50 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900 truncate">{p.title}</p>
                    {p.category && (
                      <span className="text-xs text-slate-400 font-mono">{p.category}</span>
                    )}
                  </div>
                  {p.failing_checks?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.failing_checks.slice(0, 4).map((check) => (
                        <span
                          key={check}
                          className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500"
                        >
                          {FAILING_CHECK_LABELS[check] ?? check}
                        </span>
                      ))}
                      {p.failing_checks.length > 4 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
                          +{p.failing_checks.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreBadge(p.integrity_score)}`}>
                    {p.integrity_score}/100
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                </div>
              </Link>
            ))}
          </div>

          {programs.length > 8 && (
            <div className="px-4 sm:px-6 py-3 border-t border-slate-100">
              <button
                onClick={() => setShowAll((v) => !v)}
                className="text-xs font-semibold text-brand-blue-600 hover:underline"
              >
                {showAll ? 'Show less' : `Show all ${programs.length} programs needing attention`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
