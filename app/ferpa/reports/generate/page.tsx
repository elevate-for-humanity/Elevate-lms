'use client';

import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  BarChart3,
  Download,
  Calendar,
  Loader2,
  FileText,
} from 'lucide-react';

const REPORT_TYPES = [
  { value: 'access-log', label: 'Access Log Report' },
  { value: 'disclosure', label: 'Disclosure Report' },
  { value: 'request-summary', label: 'Request Summary' },
  { value: 'training', label: 'Training Compliance' },
  { value: 'response-time', label: 'Response Time Analysis' },
  { value: 'annual', label: 'Annual Compliance Report' },
];

const FORMATS = [
  { value: 'pdf', label: 'PDF Document' },
  { value: 'csv', label: 'CSV Spreadsheet' },
  { value: 'xlsx', label: 'Excel Workbook' },
];

export default function GenerateReportPage() {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [formData, setFormData] = useState({
    reportType: 'access-log',
    startDate: '',
    endDate: '',
    format: 'pdf',
    includeDetails: true,
  });

  const [reportData, setReportData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/ferpa/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: formData.reportType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          format: formData.format,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReportData(data);
        setGenerated(true);
      }
    } catch {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/ferpa-page-8.jpg" alt="FERPA compliance" fill sizes="100vw" className="object-cover" priority />
      </section>
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Ferpa", href: "/ferpa" }, { label: "Generate" }]} />
      </div>
<div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/ferpa" className="hover:text-gray-700">FERPA Portal</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/ferpa/reports" className="hover:text-gray-700">Reports</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Generate</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Generate Report</h1>
          <p className="text-gray-600 mt-1">Create a custom FERPA compliance report</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {generated ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-brand-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Report Generated</h2>
            <p className="text-gray-600 mb-6">
              Your {REPORT_TYPES.find(t => t.value === formData.reportType)?.label} is ready for download.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
                <Download className="w-4 h-4" />
                Download Report
              </button>
              <button
                onClick={() => setGenerated(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Generate Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Report Type */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Report Type
              </h2>
              <div className="grid gap-3">
                {REPORT_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.reportType === type.value
                        ? 'border-brand-blue-500 bg-brand-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportType"
                      value={type.value}
                      checked={formData.reportType === type.value}
                      onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                    />
                    <span className="font-medium text-gray-900">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Date Range
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Options</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
                    Export Format
                  </label>
                  <select
                    id="format"
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                  >
                    {FORMATS.map((format) => (
                      <option key={format.value} value={format.value}>{format.label}</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.includeDetails}
                    onChange={(e) => setFormData({ ...formData, includeDetails: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Include detailed records (larger file size)</span>
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-4">
              <Link href="/ferpa/reports" className="px-4 py-2 text-gray-700 hover:text-gray-900">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
