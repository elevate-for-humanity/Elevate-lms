'use client';
import Image from 'next/image';
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
      // Error: $1
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
      [
        'Timestamp',
        'User',
        'Email',
        'Action',
        'Resource Type',
        'Resource ID',
      ].join(','),
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Audit Logs" }]} />
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Audit Logs" }]} />
        </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin/dashboard"
            className="text-brand-blue-600 hover:text-brand-blue-800 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-brand-blue-600" />
                <h1 className="text-3xl font-bold text-black">Audit Logs</h1>
              </div>
              <p className="text-black">
                Track all system activities and user actions
              </p>
            </div>
            <button
              onClick={exportLogs}
              className="flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-black mb-2">
              Total Events
            </h3>
            <p className="text-3xl font-bold text-brand-blue-600">
              {logs.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-black mb-2">Today</h3>
            <p className="text-3xl font-bold text-brand-green-600">
              {
                logs.filter(
                  (l) =>
                    new Date(l.created_at).toDateString() ===
                    new Date().toDateString()
                ).length
              }
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-black mb-2">
              Unique Users
            </h3>
            <p className="text-3xl font-bold text-brand-blue-600">
              {new Set(logs.map((l) => l.user_id)).size}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-black mb-2">
              Resource Types
            </h3>
            <p className="text-3xl font-bold text-brand-orange-600">
              {new Set(logs.map((l) => l.resource_type)).size}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-black mb-1">
                <Search className="w-4 h-4 inline mr-1" />
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by user, action, or resource"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                <Filter className="w-4 h-4 inline mr-1" />
                Action
              </label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
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
              <label className="block text-sm font-medium text-black mb-1">
                Resource Type
              </label>
              <select
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-black text-lg">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-black">
                          {log.user?.full_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-black">
                          {log.user?.email || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-2 text-xs rounded bg-brand-blue-100 text-brand-blue-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black">
                          {log.resource_type}
                        </div>
                        {log.resource_id && (
                          <div className="text-xs text-black">
                            ID: {log.resource_id.substring(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-black">
                        {log.metadata &&
                          Object.keys(log.metadata).length > 0 && (
                            <details className="cursor-pointer">
                              <summary className="text-brand-blue-600 hover:text-brand-blue-800">
                                View metadata
                              </summary>
                              <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-w-xs">
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
