'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  Users, 
  Clock, 
  Circle, 
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface Apprentice {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  program_slug: string;
  rapids_status: string;
  rapids_id: string | null;
  registration_date: string | null;
  ojt_hours_completed: number;
  rti_hours_completed: number;
  total_hours_required: number;
  employer_name: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  registered: 'bg-brand-blue-100 text-brand-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-brand-blue-100 text-brand-blue-800',
  cancelled: 'bg-red-100 text-red-800',
  exited: 'bg-gray-100 text-gray-800',
};

export default function RAPIDSApprenticesPage() {
  const [apprentices, setApprentices] = useState<Apprentice[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApprentices();
  }, []);

  async function fetchApprentices() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reports/rapids/export?format=json');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch apprentices');
      }
      const data = await res.json();
      setApprentices(data.apprentices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load apprentices');
      setApprentices([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(type: string, format: string) {
    setExporting(true);
    try {
      const res = await fetch(`/api/reports/rapids/export?type=${type}&format=${format}`);
      if (!res.ok) throw new Error('Export failed');
      
      if (format === 'csv') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapids-${type}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapids-${type}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (err) {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  const filteredApprentices = apprentices.filter(a => {
    const matchesSearch = 
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: apprentices.length,
    pending: apprentices.filter(a => a.status === 'pending').length,
    registered: apprentices.filter(a => a.status === 'registered').length,
    active: apprentices.filter(a => a.status === 'active').length,
    completed: apprentices.filter(a => a.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Apprentices" }]} />
      </div>
<div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">RAPIDS Apprentice Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Export apprentice data for DOL RAPIDS portal submission
            </p>
          </div>
          <a
            href="https://entbpmp.dol.gov/suite/sites/oa/page/home"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open RAPIDS Portal
          </a>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-blue-100 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.registered}</p>
                <p className="text-sm text-gray-500">Registered</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <RefreshCw className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-blue-100 rounded-lg">
                <Circle className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Export for RAPIDS Portal</h2>
          <p className="text-sm text-gray-600 mb-4">
            Download apprentice data formatted for the DOL RAPIDS portal. Upload the CSV file or copy data manually.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4">
            {/* Registration Export */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">New Registrations</h3>
              <p className="text-sm text-gray-500 mb-3">
                Export pending apprentices for initial RAPIDS registration
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('registration', 'csv')}
                  disabled={exporting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-brand-blue-600 text-white text-sm rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={() => handleExport('registration', 'json')}
                  disabled={exporting}
                  className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Progress Export */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Quarterly Progress</h3>
              <p className="text-sm text-gray-500 mb-3">
                Export hours and wage updates for quarterly reporting
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('progress', 'csv')}
                  disabled={exporting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={() => handleExport('progress', 'json')}
                  disabled={exporting}
                  className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Completion Export */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Completions</h3>
              <p className="text-sm text-gray-500 mb-3">
                Export completed apprentices for RAPIDS completion reporting
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('completion', 'csv')}
                  disabled={exporting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-brand-blue-600 text-white text-sm rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={() => handleExport('completion', 'json')}
                  disabled={exporting}
                  className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  JSON
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Apprentice List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search apprentices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="registered">Registered</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={fetchApprentices}
                  disabled={loading}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-gray-600">{error}</p>
              <button
                onClick={fetchApprentices}
                className="mt-4 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-brand-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading apprentices...</p>
            </div>
          ) : filteredApprentices.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No apprentices found</p>
              <p className="text-sm text-gray-400 mt-1">
                Apprentices will appear here once enrolled in RAPIDS-registered programs
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Apprentice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RAPIDS Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RAPIDS ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employer
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApprentices.map((apprentice: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {apprentice.firstName} {apprentice.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{apprentice.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{apprentice.programName}</div>
                        <div className="text-xs text-gray-500 font-mono">{apprentice.occupationCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[apprentice.status] || 'bg-gray-100 text-gray-800'}`}>
                          {apprentice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {apprentice.rapidsId ? (
                          <span className="font-mono text-sm text-gray-900">{apprentice.rapidsId}</span>
                        ) : (
                          <span className="text-sm text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {apprentice.ojtHoursCompleted || 0} / {apprentice.totalHoursRequired} OJT
                        </div>
                        <div className="text-xs text-gray-500">
                          {apprentice.rtiHoursCompleted || 0} / {apprentice.rtiHoursRequired || 144} RTI
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-brand-blue-600 h-1.5 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, ((apprentice.ojtHoursCompleted || 0) / (apprentice.totalHoursRequired || 1500)) * 100)}%` 
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {apprentice.employerName ? (
                          <div className="text-sm text-gray-900">{apprentice.employerName}</div>
                        ) : (
                          <span className="text-sm text-gray-400">Not assigned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-brand-blue-900 mb-3">How to Submit to RAPIDS</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-brand-blue-800">
            <li>Click "Export" above to download the CSV file for the report type you need</li>
            <li>Click "Open RAPIDS Portal" to go to the DOL RAPIDS system</li>
            <li>Log in with your Login.gov credentials (complete MFA if prompted)</li>
            <li>Navigate to the appropriate section (Register, Progress Update, or Completion)</li>
            <li>Upload the CSV file or manually enter the data from the export</li>
            <li>Review and submit the data in RAPIDS</li>
            <li>Record the RAPIDS confirmation number back in this system</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
