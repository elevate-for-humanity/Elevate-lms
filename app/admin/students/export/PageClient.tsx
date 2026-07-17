'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, User, Filter, Calendar } from 'lucide-react';

export default function PageClient() {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ format });
      if (includeArchived) params.set('include_archived', 'true');
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      
      const res = await fetch(`/api/admin/students/export?${params}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students-export-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileSpreadsheet className="w-6 h-6" /> Export Students</h1>
      </div>
      <div className="bg-white p-6 rounded-lg border space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Export Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value as 'csv' | 'xlsx')} className="w-full px-4 py-2 border rounded-lg">
                <option value="csv">CSV</option>
                <option value="xlsx">Excel (XLSX)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range (Optional)</label>
              <div className="flex gap-2">
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" className="flex-1 px-4 py-2 border rounded-lg" />
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" className="flex-1 px-4 py-2 border rounded-lg" />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} className="w-5 h-5" />
              <span className="text-sm font-medium text-gray-700">Include Archived Students</span>
            </label>
          </div>
        </div>
        <div className="pt-4 border-t">
          <button onClick={handleExport} disabled={loading} className="px-6 py-3 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50">
            <Download className="w-5 h-5" />
            {loading ? 'Exporting...' : `Download ${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
