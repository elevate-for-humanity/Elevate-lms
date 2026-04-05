import { requireAdmin } from '@/lib/auth';
'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Filter, Download, Search } from 'lucide-react';

type AuditLog = {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: any;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, [actionFilter, resourceFilter]);

  const loadLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (resourceFilter) params.append('resource_type', resourceFilter);

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(search) ||
      log.resource_type.toLowerCase().includes(search) ||
      log.user?.email?.toLowerCase().includes(search) ||
      log.user?.full_name?.toLowerCase().includes(search)
    );
  });

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'User', 'Email', 'Action', 'Resource Type', 'Resource ID'].join(','),
      ...filteredLogs.map((log) =>
        [
          new Date(log.created_at).toISOString(),
          log.user?.full_name || 'Unknown',
          log.user?.email || '',
          log.action,
          log.resource_type,
          log.resource_id || '',
        ]
          .map((field) => `"${field}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-4">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Audit Logs' }]} />
        </div>

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin/dashboard" className="text-sm text-gray-500 hover:text-gray-600 mb-3 inline-block">
              ← Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <h1 className="text-2xl font-semibold text-gray-900">Audit Logs</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">Track all system activities and user actions</p>
          </div>
          <button
            onClick={exportLogs}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Events', value: logs.length },
            { label: 'Today', value: logs.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length },
            { label: 'Unique Users', value: new Set(logs.map((l) => l.user_id)).size },
            { label: 'Resource Types', value: new Set(logs.map((l) => l.resource_type)).size },
          ].map(({ label, value }) => (
            <div key={label} className="border border-gray-200 rounded-lg p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                <Search className="w-3.5 h-3.5 inline mr-1" />Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by user, action, or resource"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                <Filter className="w-3.5 h-3.5 inline mr-1" />Action
              </label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              >
                <option value="">All Actions</option>
                <option value="user_created">User Created</option>
                <option value="user_updated">User Updated</option>
                <option value="data_exported">Data Exported</option>
                <option value="enrollment_created">Enrollment Created</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Resource Type</label>
              <select
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              >
                <option value="">All Types</option>
                <option value="user">User</option>
                <option value="enrollment">Enrollment</option>
                <option value="shop">Shop</option>
                <option value="students">Students</option>
                <option value="weekly_hours">Weekly Hours</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Timestamp', 'User', 'Action', 'Resource', 'Details'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.user?.full_name || 'Unknown'}</div>
                        <div className="text-xs text-gray-400">{log.user?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded border border-gray-200 text-gray-600">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{log.resource_type}</div>
                        {log.resource_id && (
                          <div className="text-xs text-gray-400">ID: {log.resource_id.substring(0, 8)}...</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="cursor-pointer">
                            <summary className="text-xs text-gray-400 hover:text-gray-600">View metadata</summary>
                            <pre className="mt-2 text-xs bg-gray-50 border border-gray-100 p-2 rounded overflow-auto max-w-xs">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
