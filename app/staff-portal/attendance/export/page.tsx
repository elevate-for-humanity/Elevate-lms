import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Download, FileSpreadsheet, Calendar, Users, 
  Filter, Clock, CheckCircle, ArrowLeft
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Export Attendance | Staff Portal | Elevate For Humanity',
  description: 'Export attendance records for reporting and compliance.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ExportAttendancePage() {
  const supabase = await createClient();
  
  if (!supabase) {
    redirect('/login');
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login?redirect=/staff-portal/attendance/export');
  }

  // Fetch cohorts for filter
  const { data: cohorts } = await supabase
    .from('cohorts')
    .select('id, name')
    .order('name');

  const cohortList = cohorts || [];

  // Get summary stats
  const { count: totalRecords } = await supabase
    .from('attendance_hours')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Staff Portal', href: '/staff-portal' },
            { label: 'Attendance', href: '/staff-portal/attendance' },
            { label: 'Export' }
          ]} />
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Link 
            href="/staff-portal/attendance" 
            className="inline-flex items-center gap-2 text-emerald-100 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Attendance
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Download className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Export Attendance Records</h1>
              <p className="text-emerald-100 mt-1">
                Generate reports for compliance, payroll, and analysis
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Export Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Export Options</h2>
              
              <form className="space-y-6">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date Range
                  </label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                        defaultValue={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">End Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                        defaultValue={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </div>

                {/* Cohort Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Cohort/Program
                  </label>
                  <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500">
                    <option value="">All Cohorts</option>
                    {cohortList.map((cohort: any) => (
                      <option key={cohort.id} value={cohort.id}>{cohort.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Filter className="w-4 h-4 inline mr-2" />
                    Attendance Status
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {['All', 'Present', 'Absent', 'Late', 'Excused'].map(status => (
                      <label key={status} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked={status === 'All'}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Export Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileSpreadsheet className="w-4 h-4 inline mr-2" />
                    Export Format
                  </label>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { id: 'csv', label: 'CSV', desc: 'Spreadsheet compatible' },
                      { id: 'xlsx', label: 'Excel', desc: 'Microsoft Excel format' },
                      { id: 'pdf', label: 'PDF', desc: 'Print-ready report' },
                    ].map(format => (
                      <label
                        key={format.id}
                        className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-emerald-300 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50"
                      >
                        <input
                          type="radio"
                          name="format"
                          value={format.id}
                          defaultChecked={format.id === 'csv'}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{format.label}</div>
                          <div className="text-xs text-gray-500">{format.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Include Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Include in Export
                  </label>
                  <div className="space-y-2">
                    {[
                      'Student names and IDs',
                      'Hours worked per day',
                      'Weekly/monthly summaries',
                      'Absence reasons',
                      'Instructor notes',
                    ].map(option => (
                      <label key={option} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                  >
                    <Download className="w-5 h-5" />
                    Generate Export
                  </button>
                  <button
                    type="button"
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                  >
                    Preview
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Export Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Records</span>
                  <span className="font-semibold text-gray-900">{totalRecords || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Date Range</span>
                  <span className="font-semibold text-gray-900">30 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Estimated Size</span>
                  <span className="font-semibold text-gray-900">~50 KB</span>
                </div>
              </div>
            </div>

            {/* Recent Exports */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Exports</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      attendance_jan_2024.csv
                    </div>
                    <div className="text-xs text-gray-500">2 days ago</div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-emerald-600">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      monthly_report_dec.xlsx
                    </div>
                    <div className="text-xs text-gray-500">1 week ago</div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-emerald-600">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="bg-emerald-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Export Tips</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  Use CSV for importing into other systems
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  Excel format includes formatting and formulas
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  PDF is best for printing and sharing
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
