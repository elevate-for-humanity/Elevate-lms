'use client';

import toast from 'react-hot-toast';
import { useState } from 'react';
import { Download } from 'lucide-react';

const REPORT_TYPES = [
  { value: 'enrollment', label: 'Enrollment Report' },
  { value: 'outcomes', label: 'Employment Outcomes' },
  { value: 'performance', label: 'Performance Metrics' },
  { value: 'demographics', label: 'Demographics' },
  { value: 'services', label: 'Supportive Services' },
] as const;

export function WioaExportButton() {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleExport(type: string) {
    setOpen(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/wioa/reporting?type=${type}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? 'Export failed');
        return;
      }
      const data = await res.json();
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wioa-${type}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Network error — try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {loading ? 'Exporting…' : 'Export Report'}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1">
          {REPORT_TYPES.map((r) => (
            <button
              key={r.value}
              onClick={() => handleExport(r.value)}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
