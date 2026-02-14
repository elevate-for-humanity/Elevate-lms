

'use client';

import React from 'react';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Download, Calendar, Users, Clock } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

type Report = {
  id: string;
  student_name: string;
  report_type: string;
  period: string;
  hours: number;
  status: string;
  created_at: string;
};

export default function ShopReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await fetch('/api/shop/reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      // Error: $1
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((report) => {
    if (filter === 'all') return true;
    return report.report_type === filter;
  });

  const downloadReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/shop/reports/${reportId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${reportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      // Error: $1
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }, { label: 'Reports' }]} />
        </div>
      </div>

      <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/shop/dashboard"
            className="text-brand-blue-600 hover:text-brand-blue-800 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-8 h-8 text-brand-blue-600" />
                <h1 className="text-3xl font-bold text-black">Reports</h1>
              </div>
              <p className="text-black">
                View and download student progress reports
              </p>
            </div>
            <Link
              href="/shop/reports/new"
              className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 font-medium"
            >
              + New Report
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-brand-blue-600" />
              <h3 className="text-sm font-medium text-black">
                Total Reports
              </h3>
            </div>
            <p className="text-3xl font-bold text-brand-blue-600">
              {reports.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-brand-green-600" />
              <h3 className="text-sm font-medium text-black">
                Active Students
              </h3>
            </div>
            <p className="text-3xl font-bold text-brand-green-600">
              {new Set(reports.map((r) => r.student_name)).size}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-brand-blue-600" />
              <h3 className="text-sm font-medium text-black">Total Hours</h3>
            </div>
            <p className="text-3xl font-bold text-brand-blue-600">
              {reports.reduce((sum, r) => sum + r.hours, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-brand-orange-600" />
              <h3 className="text-sm font-medium text-black">This Month</h3>
            </div>
            <p className="text-3xl font-bold text-brand-orange-600">
              {
                reports.filter((r) => {
                  const date = new Date(r.created_at);
                  const now = new Date();
                  return (
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear()
                  );
                }).length
              }
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Report Type
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Reports</option>
                <option value="weekly">Weekly Hours</option>
                <option value="monthly">Monthly Progress</option>
                <option value="evaluation">Performance Evaluation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-black text-lg">No reports found</p>
              <p className="text-black text-sm mt-2">
                Create your first report to get started
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black">
                        {report.student_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-2 text-xs rounded bg-brand-blue-100 text-brand-blue-800">
                        {report.report_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {report.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {report.hours} hrs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-2 text-xs rounded ${
                          report.status === 'approved'
                            ? 'bg-brand-green-100 text-green-800'
                            : report.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-black'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => downloadReport(report.id)}
                        className="text-brand-blue-600 hover:text-brand-blue-900 mr-3"
                      >
                        <Download className="w-4 h-4 inline mr-1" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
