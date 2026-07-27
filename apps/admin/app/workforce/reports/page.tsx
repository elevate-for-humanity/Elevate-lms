export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { FileText, Download, Calendar, BarChart3, PieChart, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Reports | Workforce | Admin | Elevate For Humanity',
};

export default async function ReportsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await createClient();

  const { data: participants } = await db
    .from('workforce_participants')
    .select('*');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Workforce Reports</h1>
        <p className="text-gray-600 mt-1">Generate and download workforce development reports</p>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-100 rounded-lg w-fit mb-4">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Enrollment Summary</h3>
          <p className="text-sm text-gray-500 mb-4">Overview of participant enrollments by program and timeframe</p>
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>

        <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Placement Outcomes</h3>
          <p className="text-sm text-gray-500 mb-4">Employment placement rates and wage data</p>
          <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>

        <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
          <div className="p-3 bg-purple-100 rounded-lg w-fit mb-4">
            <PieChart className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Program Demographics</h3>
          <p className="text-sm text-gray-500 mb-4">Demographic breakdown of participants served</p>
          <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>

        <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-100 rounded-lg w-fit mb-4">
            <FileText className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Compliance Status</h3>
          <p className="text-sm text-gray-500 mb-4">Documentation and compliance tracking report</p>
          <button className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>

        <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
          <div className="p-3 bg-red-100 rounded-lg w-fit mb-4">
            <Calendar className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Monthly Progress</h3>
          <p className="text-sm text-gray-500 mb-4">Monthly participant progress and milestone tracking</p>
          <button className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>

        <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
          <div className="p-3 bg-gray-100 rounded-lg w-fit mb-4">
            <FileText className="w-6 h-6 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Annual Summary</h3>
          <p className="text-sm text-gray-500 mb-4">Complete annual workforce development summary</p>
          <button className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="mt-8 bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Recent Reports</h2>
        </div>
        <div className="divide-y">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium">Q1 2025 Enrollment Summary</div>
                <div className="text-sm text-gray-500">Generated on March 31, 2025</div>
              </div>
            </div>
            <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium">February 2025 Placement Report</div>
                <div className="text-sm text-gray-500">Generated on February 28, 2025</div>
              </div>
            </div>
            <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium">WIOA Compliance Status - Feb 2025</div>
                <div className="text-sm text-gray-500">Generated on February 15, 2025</div>
              </div>
            </div>
            <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
