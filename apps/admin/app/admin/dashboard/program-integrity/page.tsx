'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, RefreshCw, AlertTriangle, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

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
  if (score >= 80) return 'text-brand-green-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function scoreBadge(score: number): string {
  if (score >= 80) return 'bg-brand-green-100 text-brand-green-700';
  if (score >= 60) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

export default function ProgramIntegrityPage() {
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'good'>('all');

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/program-integrity?limit=100&min=0');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPrograms(data.programs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [fetchData]);

  const critical = programs.filter(p => p.integrity_score < 60);
  const warning = programs.filter(p => p.integrity_score >= 60 && p.integrity_score < 80);
  const good = programs.filter(p => p.integrity_score >= 80);
  
  const filtered = filter === 'all' ? programs 
    : filter === 'critical' ? critical
    : filter === 'warning' ? warning
    : good;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-slate-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Program Integrity</h1>
            <p className="text-sm text-slate-500">Monitor program health and fix issues</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-slate-900">{programs.length}</p>
          <p className="text-sm text-slate-500">Total Programs</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <p className="text-2xl font-bold text-red-600">{critical.length}</p>
          <p className="text-sm text-red-700">Critical Issues</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <p className="text-2xl font-bold text-amber-600">{warning.length}</p>
          <p className="text-sm text-amber-700">Warnings</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <p className="text-2xl font-bold text-green-600">{good.length}</p>
          <p className="text-sm text-green-700">Healthy</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['all', 'critical', 'warning', 'good'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Program List */}
      {!loading && (
        <div className="bg-white rounded-xl border">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {filter === 'good' ? 'No programs with perfect scores yet' : 'No programs in this category'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Program</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Issues</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Score</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{p.title}</p>
                      <p className="text-xs text-slate-400">{p.category || 'Uncategorized'}</p>
                    </td>
                    <td className="px-4 py-3">
                      {p.failing_checks.length === 0 ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4" /> All checks pass
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {p.failing_checks.slice(0, 3).map(check => (
                            <span key={check} className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {FAILING_CHECK_LABELS[check] || check}
                            </span>
                          ))}
                          {p.failing_checks.length > 3 && (
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-400">
                              +{p.failing_checks.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold px-2 py-1 rounded ${scoreBadge(p.integrity_score)}`}>
                        {p.integrity_score}/100
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/programs/${p.id}`}
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1 justify-end"
                      >
                        Fix <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}