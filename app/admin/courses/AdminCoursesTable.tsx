'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useMemo } from 'react';
import type { AdminCourseOverview, AdminCourseStatus } from '@/lib/admin/course-admin-overview';

function StatusBadge({ status }: { status: AdminCourseStatus }) {
  const map: Record<AdminCourseStatus, { label: string; cls: string }> = {
    complete:   { label: 'Complete',   cls: 'bg-emerald-100 text-emerald-800' },
    partial:    { label: 'Partial',    cls: 'bg-amber-100 text-amber-800' },
    structured: { label: 'Structured', cls: 'bg-brand-blue-100 text-brand-blue-800' },
    empty:      { label: 'Empty',      cls: 'bg-slate-100 text-slate-600' },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function GenerateButton({ courseId, disabled }: { courseId: string; disabled?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/courses/${courseId}/generate-missing`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? 'Generation failed');
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={disabled || pending}
        className="rounded border px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? 'Generating…' : 'Generate Missing'}
      </button>
      {error && <span className="text-xs text-brand-red-600">{error}</span>}
    </div>
  );
}

export function AdminCoursesTable({ courses }: { courses: AdminCourseOverview[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminCourseStatus | 'all'>('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return courses.filter(c => {
      const matchesSearch = !q || c.title.toLowerCase().includes(q) || (c.slug ?? '').includes(q);
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [courses, search, statusFilter]);

  const counts = useMemo(() => ({
    complete:   courses.filter(c => c.status === 'complete').length,
    partial:    courses.filter(c => c.status === 'partial').length,
    structured: courses.filter(c => c.status === 'structured').length,
    empty:      courses.filter(c => c.status === 'empty').length,
  }), [courses]);

  return (
    <div className="space-y-4">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'complete', 'partial', 'structured', 'empty'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              statusFilter === s
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s === 'all' ? `All (${courses.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${counts[s]})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Search by title or slug…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Course</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Expected</th>
              <th className="px-4 py-3 font-semibold text-right">Actual</th>
              <th className="px-4 py-3 font-semibold text-right">Modules</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(course => (
              <tr key={course.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{course.title}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {course.slug ?? course.id.slice(0, 8)}
                    {course.blueprintSlug && (
                      <span className="ml-2 text-brand-blue-500">· {course.blueprintSlug}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={course.status} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {course.expectedLessons > 0 ? course.expectedLessons : '—'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                  {course.actualLessons}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {course.expectedModules > 0 ? course.expectedModules : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-start gap-2">
                    <Link
                      href={`/admin/courses/${course.id}/inspect`}
                      className="rounded border px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Inspect
                    </Link>
                    <Link
                      href={`/admin/courses/${course.id}/content`}
                      className="rounded border px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/lms/courses/${course.id}`}
                      className="rounded border px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      LMS
                    </Link>
                    <GenerateButton
                      courseId={course.id}
                      disabled={!course.blueprintId || course.status === 'complete'}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No courses match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="border-t px-4 py-3 text-xs text-slate-400">
          Showing {filtered.length} of {courses.length} courses
        </div>
      </div>
    </div>
  );
}
