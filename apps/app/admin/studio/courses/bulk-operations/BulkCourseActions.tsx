'use client';

import toast from 'react-hot-toast';
import { useState } from 'react';
import { CheckSquare, Square, Archive, Globe, Download, Trash2 } from 'lucide-react';
import { bulkUpdateCourseStatus, exportCoursesCSV } from './actions';

interface Course {
  id: string;
  title: string;
  slug: string;
  status: string;
  is_active: boolean;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-green-100 text-green-800',
  draft:     'bg-amber-100 text-amber-800',
  archived:  'bg-slate-100 text-slate-500',
};

export function BulkCourseActions({ courses }: { courses: Course[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');

  const filtered = courses.filter((c) => filter === 'all' || c.status === filter);
  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  function toggleAll() {
    if (allSelected) {
      setSelected((s) => { const n = new Set(s); filtered.forEach((c) => n.delete(c.id)); return n; });
    } else {
      setSelected((s) => { const n = new Set(s); filtered.forEach((c) => n.add(c.id)); return n; });
    }
  }

  function toggle(id: string) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function handleBulkStatus(status: 'published' | 'archived' | 'draft') {
    if (selected.size === 0) return;
    if (!confirm(`${status === 'published' ? 'Publish' : status === 'archived' ? 'Archive' : 'Unpublish'} ${selected.size} course(s)?`)) return;
    setLoading(true);
    const result = await bulkUpdateCourseStatus([...selected], status);
    if (!result.success) toast.error(`Error: ${result.error}`);
    else setSelected(new Set());
    setLoading(false);
  }

  async function handleExport() {
    setLoading(true);
    const result = await exportCoursesCSV([...selected]);
    if (result.csv) {
      const blob = new Blob([result.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `courses-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <span className="text-sm font-semibold text-slate-700">
          {selected.size > 0 ? `${selected.size} selected` : 'Select courses'}
        </span>

        {/* Filter pills */}
        <div className="flex gap-1 ml-auto">
          {(['all', 'published', 'draft', 'archived'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1 rounded-full transition ${filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Bulk action buttons */}
        {selected.size > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkStatus('published')}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 border border-green-200 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition disabled:opacity-50"
            >
              <Globe className="w-3.5 h-3.5" />
              Publish
            </button>
            <button
              onClick={() => handleBulkStatus('archived')}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
            >
              <Archive className="w-3.5 h-3.5" />
              Archive
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead className="border-b border-slate-100">
          <tr>
            <th className="px-4 py-3 w-10">
              <button onClick={toggleAll} className="text-slate-400 hover:text-slate-700">
                {allSelected ? <CheckSquare className="w-4 h-4 text-brand-blue-600" /> : <Square className="w-4 h-4" />}
              </button>
            </th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Course</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Slug</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {filtered.map((course) => (
            <tr key={course.id} className={`hover:bg-slate-50 transition ${selected.has(course.id) ? 'bg-brand-blue-50' : ''}`}>
              <td className="px-4 py-3">
                <button onClick={() => toggle(course.id)} className="text-slate-400 hover:text-brand-blue-600">
                  {selected.has(course.id)
                    ? <CheckSquare className="w-4 h-4 text-brand-blue-600" />
                    : <Square className="w-4 h-4" />}
                </button>
              </td>
              <td className="px-4 py-3 font-semibold text-slate-900">{course.title}</td>
              <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-slate-500">{course.slug}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[course.status] ?? 'bg-slate-100 text-slate-500'}`}>
                  {course.status}
                </span>
              </td>
              <td className="px-4 py-3 hidden sm:table-cell text-xs text-slate-500">
                {new Date(course.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-slate-400 text-sm">No courses match this filter</div>
      )}
    </div>
  );
}
