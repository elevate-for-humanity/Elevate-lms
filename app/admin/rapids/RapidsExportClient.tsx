'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Calendar, Filter, RefreshCw } from 'lucide-react';

interface RapidsExport {
  id: string;
  student_name: string;
  program: string;
  completion_date: string;
  credential_id: string;
  rapids_code: string;
  score?: number;
  exported_at: string;
  exported_by: string;
}

export default function RapidsExportClient() {
  const [exports, setExports] = useState<RapidsExport[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchExports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      const res = await fetch(`/api/admin/rapids/export?${params}`);
      if (res.ok) {
        const data = await res.json();
        setExports(data.exports || []);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  const downloadCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      params.set('format', 'csv');
      window.open(`/api/admin/rapids/export?${params}`, '_blank');
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileSpreadsheet className="w-6 h-6" /> RAPIDS Export</h1>
        <div className="flex gap-2">
          <button onClick={fetchExports} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={downloadCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-4 py-2 border rounded-lg" />
          </div>
          <button onClick={fetchExports} className="px-4 py-2 bg-slate-600 text-white rounded-lg flex items-center gap-2">
            <Filter className="w-4 h-4" /> Apply Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">RAPIDS Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credential ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exported</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {exports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">No exports found</td>
              </tr>
            ) : (
              exports.map(exp => (
                <tr key={exp.id}>
                  <td className="px-4 py-3 font-medium">{exp.student_name}</td>
                  <td className="px-4 py-3 text-gray-600">{exp.program}</td>
                  <td className="px-4 py-3 font-mono">{exp.rapids_code}</td>
                  <td className="px-4 py-3 font-mono text-sm">{exp.credential_id}</td>
                  <td className="px-4 py-3">{exp.score ? `${exp.score}%` : '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{exp.exported_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
