import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { BarChart3, Download, Calendar, TrendingUp, Users, DollarSign, ArrowLeft, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'WIOA Reports | Admin',
  description: 'Generate and view WIOA performance reports.',
  robots: { index: false, follow: false },
};

const reportTypes = [
  { id: 'quarterly', name: 'Quarterly Performance Report', description: 'WIOA performance metrics for state reporting', lastGenerated: 'Jan 1, 2025' },
  { id: 'enrollment', name: 'Enrollment Summary', description: 'Participant enrollment and demographics', lastGenerated: 'Jan 15, 2025' },
  { id: 'outcomes', name: 'Outcome Tracking Report', description: 'Employment and credential outcomes', lastGenerated: 'Jan 10, 2025' },
  { id: 'expenditure', name: 'Expenditure Report', description: 'Training and support service costs', lastGenerated: 'Jan 5, 2025' },
  { id: 'compliance', name: 'Compliance Audit Report', description: 'Documentation and eligibility compliance', lastGenerated: 'Dec 31, 2024' },
];

const metrics = [
  { label: 'Total Participants', value: '1,247', change: '+12%', icon: Users },
  { label: 'Employment Rate', value: '78%', change: '+5%', icon: TrendingUp },
  { label: 'Avg. Wage at Exit', value: '$18.50/hr', change: '+8%', icon: DollarSign },
  { label: 'Credential Rate', value: '85%', change: '+3%', icon: FileText },
];

export default function WIOAReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Reports" }]} />
      </div>
<div className="max-w-6xl mx-auto">
        <Link href="/admin/wioa" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to WIOA Management
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WIOA Reports</h1>
            <p className="text-gray-600">Generate performance and compliance reports</p>
          </div>
          <div className="flex gap-3">
            <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>Q4 2024</option>
              <option>Q3 2024</option>
              <option>Q2 2024</option>
              <option>Q1 2024</option>
            </select>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <metric.icon className="w-8 h-8 text-blue-600 mb-3" />
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">{metric.label}</p>
                <span className="text-sm text-green-600 font-medium">{metric.change}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold text-gray-900">Available Reports</h2>
          </div>
          <div className="divide-y">
            {reportTypes.map((report) => (
              <div key={report.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{report.name}</h3>
                    <p className="text-sm text-gray-500">{report.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Last generated</p>
                    <p className="text-sm font-medium text-gray-700">{report.lastGenerated}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Schedule
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
