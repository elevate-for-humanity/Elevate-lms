'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  FileText,
  Download,
  Calendar,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  BarChart3,
  Filter,
  ChevronRight,
} from 'lucide-react';

const reportTypes = [
  { id: 'hours', name: 'Hours Report', icon: Clock, description: 'Apprentice work hours by period' },
  { id: 'attendance', name: 'Attendance Report', icon: Calendar, description: 'Attendance tracking and patterns' },
  { id: 'competency', name: 'Competency Report', icon: CheckCircle, description: 'Skills completion and progress' },
  { id: 'evaluation', name: 'Evaluation Report', icon: BarChart3, description: 'Performance evaluations summary' },
  { id: 'compliance', name: 'Compliance Report', icon: FileText, description: 'State compliance documentation' },
  { id: 'payroll', name: 'Payroll Report', icon: TrendingUp, description: 'Hours for payroll processing' },
];

const recentReports = [
  { name: 'Monthly Hours - May 2026', type: 'hours', generatedAt: 'Jun 1, 2026', size: '124 KB' },
  { name: 'Q1 Competency Summary', type: 'competency', generatedAt: 'Apr 1, 2026', size: '89 KB' },
  { name: 'Compliance Export', type: 'compliance', generatedAt: 'May 15, 2026', size: '245 KB' },
];

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '2026-01-01', end: '2026-06-15' });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/host-shop/dashboard" className="w-10 h-10 bg-gradient-to-br from-brand-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </Link>
              <div>
                <p className="font-bold text-slate-900">Elevate</p>
                <p className="text-xs text-slate-500">Reports</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Reports & Analytics</h1>
          <p className="text-slate-500">Generate and download detailed reports for your apprentices</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Filters:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedType === 'all' ? 'bg-brand-blue-100 text-brand-blue-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            {reportTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedType === type.id ? 'bg-brand-blue-100 text-brand-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Report Types */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Generate New Report</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {reportTypes.map((report) => (
                  <button
                    key={report.id}
                    className={`p-5 border-2 rounded-xl text-left transition hover:shadow-md ${
                      selectedType === report.id ? 'border-brand-blue-500 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedType(report.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedType === report.id ? 'bg-brand-blue-100' : 'bg-slate-100'
                      }`}>
                        <report.icon className={`w-6 h-6 ${
                          selectedType === report.id ? 'text-brand-blue-600' : 'text-slate-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">{report.name}</h3>
                        <p className="text-sm text-slate-500">{report.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  Selected: <span className="font-medium text-slate-700">
                    {selectedType === 'all' ? 'All Reports' : reportTypes.find(r => r.id === selectedType)?.name}
                  </span>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-semibold hover:bg-brand-blue-700 transition">
                  <Download className="w-4 h-4" />
                  Generate Report
                </button>
              </div>
            </div>
          </div>

          {/* Recent Reports */}
          <div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Reports</h2>
              <div className="space-y-3">
                {recentReports.map((report, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                      {report.type === 'hours' && <Clock className="w-5 h-5 text-brand-blue-600" />}
                      {report.type === 'competency' && <CheckCircle className="w-5 h-5 text-brand-blue-600" />}
                      {report.type === 'compliance' && <FileText className="w-5 h-5 text-brand-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{report.name}</p>
                      <p className="text-xs text-slate-500">{report.generatedAt} • {report.size}</p>
                    </div>
                    <button className="p-2 hover:bg-white rounded-lg transition">
                      <Download className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-sm text-brand-blue-600 font-medium hover:underline">
                View All Reports
              </button>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-4">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Stats</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Reports Generated</span>
                  <span className="font-bold text-slate-900">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">This Month</span>
                  <span className="font-bold text-brand-blue-600">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Last Export</span>
                  <span className="font-bold text-slate-900">Jun 1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
