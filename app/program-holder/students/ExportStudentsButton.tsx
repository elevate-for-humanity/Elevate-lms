'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

export function ExportStudentsButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch('/api/program-holder/students');
      if (!res.ok) { alert('Export failed'); return; }
      const data = await res.json();
      const students: any[] = data.students ?? data ?? [];
      if (!students.length) { alert('No students to export'); return; }

      // Build CSV
      const headers = ['Name', 'Email', 'Program', 'Status', 'Enrolled At'];
      const rows = students.map((s: any) => [
        s.full_name ?? s.name ?? '',
        s.email ?? '',
        s.program ?? s.program_title ?? '',
        s.status ?? '',
        s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString() : '',
      ]);
      const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Network error — try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {loading ? 'Exporting…' : 'Export CSV'}
    </button>
  );
}
