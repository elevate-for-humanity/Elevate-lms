"use client";
import React from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
export const dynamic = 'force-dynamic';



export default function ExportStudentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [format, setFormat] = useState('csv');
  const [program, setProgram] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includeGrades, setIncludeGrades] = useState(false);
  const [includeAttendance, setIncludeAttendance] = useState(false);
  const [includeCertificates, setIncludeCertificates] = useState(false);
  const [includeFinancial, setIncludeFinancial] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setError('');

    try {
      // Build query parameters
      const params = new URLSearchParams({
        format,
        ...(program && { program }),
        ...(status && { status }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
        ...(includeGrades && { include_grades: 'true' }),
        ...(includeAttendance && { include_attendance: 'true' }),
        ...(includeCertificates && { include_certificates: 'true' }),
        ...(includeFinancial && { include_financial: 'true' }),
      });

      const response = await fetch(`/api/admin/export/students?${params}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError((err as Error).message || 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-8">

      {/* Hero Image */}
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Export" }]} />
      </div>
<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin/students"
            className="text-brand-blue-600 hover:text-brand-blue-800 mb-4 inline-block"
          >
            ← Back to Students
          </Link>
          <h1 className="text-3xl font-bold text-black">
            Export Student Data
          </h1>
          <p className="mt-2 text-black">
            Generate and download student reports in various formats.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-brand-red-50 border border-brand-red-200 text-brand-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Export Options */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">
              Export Options
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-black mb-3">
                Select Export Format
              </label>
              <div className="grid md:grid-cols-3 gap-4">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-brand-blue-500">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={format === 'csv'}
                    onChange={(e) => setFormat(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-semibold text-black">CSV</div>
                    <div className="text-xs text-black">
                      Excel compatible
                    </div>
                  </div>
                </label>
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-brand-blue-500 opacity-50">
                  <input
                    type="radio"
                    name="format"
                    value="excel"
                    disabled
                    className="mr-3"
                  />
                  <div>
                    <div className="font-semibold text-black">Excel</div>
                    <div className="text-xs text-black">Available now</div>
                  </div>
                </label>
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-brand-blue-500 opacity-50">
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    disabled
                    className="mr-3"
                  />
                  <div>
                    <div className="font-semibold text-black">PDF</div>
                    <div className="text-xs text-black">Available now</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Data Selection */}
            <div>
              <label className="block text-sm font-medium text-black mb-3">
                Select Data to Include
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className="rounded text-brand-blue-600"
                  />
                  <span className="text-sm text-black">
                    Basic Information (Name, Email, Phone)
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className="rounded text-brand-blue-600"
                  />
                  <span className="text-sm text-black">
                    Enrollment Status
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className="rounded text-brand-blue-600"
                  />
                  <span className="text-sm text-black">Course Progress</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeGrades}
                    onChange={(e) => setIncludeGrades(e.target.checked)}
                    className="rounded text-brand-blue-600"
                  />
                  <span className="text-sm text-black">
                    Grades and Assessments
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeAttendance}
                    onChange={(e) => setIncludeAttendance(e.target.checked)}
                    className="rounded text-brand-blue-600"
                  />
                  <span className="text-sm text-black">
                    Attendance Records
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeCertificates}
                    onChange={(e) => setIncludeCertificates(e.target.checked)}
                    className="rounded text-brand-blue-600"
                  />
                  <span className="text-sm text-black">
                    Certificates Earned
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeFinancial}
                    onChange={(e) => setIncludeFinancial(e.target.checked)}
                    className="rounded text-brand-blue-600"
                  />
                  <span className="text-sm text-black">
                    Financial Information
                  </span>
                </label>
              </div>
            </div>

            {/* Filter Options */}
            <div>
              <label className="block text-sm font-medium text-black mb-3">
                Filter Students
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-black mb-1">
                    Program
                  </label>
                  <select
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
                  >
                    <option value="">All Programs</option>
                    <option value="barber-apprenticeship">
                      Barber Apprenticeship
                    </option>
                    <option value="cna">CNA</option>
                    <option value="hvac">HVAC</option>
                    <option value="medical-assistant">Medical Assistant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-black mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="withdrawn">Withdrawn</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-black mb-1">
                    Start Date From
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-black mb-1">
                    Start Date To
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Export Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="text-sm text-black">
                Ready to export student data
              </div>
              <div className="flex gap-4">
                <Link
                  href="/admin/students"
                  className="px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  onClick={handleExport}
                  disabled={loading}
                  className="px-6 py-2 bg-brand-blue-600 text-white rounded-md hover:bg-brand-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generating...' : 'Generate Export'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Exports */}
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">
              Recent Exports
            </h2>
          </div>
          <div className="p-6">
            <div className="text-center text-black py-8">
              No recent exports. Generate your first export above.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
