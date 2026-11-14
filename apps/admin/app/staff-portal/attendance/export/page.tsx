import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { requireStaffPortalAccess } from '@/lib/staff-portal/access';
import {
  Download,
  FileSpreadsheet,
  Calendar,
  Users,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Export Attendance | Staff Portal',
  description: 'Export attendance records for reporting and compliance.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ExportAttendancePage() {
  await requireStaffPortalAccess();
  const supabase = await createClient();

  // Fetch cohorts for filter
  const { data: cohorts } = await supabase.from('cohorts').select('id, name').order('name');

  const cohortList = cohorts || [];

  // Get summary stats
  const { count: totalRecords } = await supabase
    .from('attendance_hours')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Staff Portal', href: '/staff-portal' },
              { label: 'Attendance', href: '/staff-portal/attendance' },
              { label: 'Export' },
            ]}
          />
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
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Export Options</h2>

              <form action="/api/staff/attendance/export" method="get" className="space-y-6">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date Range
                  </label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        name="start"
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                        defaultValue={
                          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                            .toISOString()
                            .split('T')[0]
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-700 mb-1">End Date</label>
                      <input
                        type="date"
                        name="end"
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                        defaultValue={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </div>

                {/* Cohort Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Cohort/Program
                  </label>
                  <select name="cohort_id" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500">
                    <option value="">All Cohorts</option>
                    {cohortList.map((cohort: any) => (
                      <option key={cohort.id} value={cohort.id}>
                        {cohort.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Export Format */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    <FileSpreadsheet className="w-4 h-4 inline mr-2" />
                    Export Format
                  </label>
                  <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
                    <p className="font-medium text-slate-900">CSV</p>
                    <p className="text-xs text-slate-700">Live attendance rows, spreadsheet compatible</p>
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
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Export Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">Total Records</span>
                  <span className="font-semibold text-slate-900">{totalRecords || 0}</span>
                </div>
                <p className="text-sm text-slate-700">The selected date and cohort filters are applied when the CSV is generated.</p>
              </div>
            </div>

            {/* Help */}
            <div className="bg-emerald-50 rounded-xl p-6">
              <h3 className="font-semibold text-slate-900 mb-3">Export Tips</h3>
              <ul className="space-y-2 text-sm text-slate-900">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  Use CSV for importing into other systems
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  Exports contain the canonical enrollment ID, date, hours, type, and verification state
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
