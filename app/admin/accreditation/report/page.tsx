import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Download, Calendar, AlertTriangle, Clock, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Accreditation Report | Admin',
  description: 'Generate and view accreditation compliance reports.',
  robots: { index: false, follow: false },
};

const reportData = {
  overallScore: 94,
  lastAudit: 'January 15, 2025',
  nextAudit: 'July 15, 2025',
  categories: [
    { name: 'Curriculum Standards', score: 96, status: 'compliant' },
    { name: 'Instructor Qualifications', score: 92, status: 'compliant' },
    { name: 'Student Outcomes', score: 95, status: 'compliant' },
    { name: 'Facility Requirements', score: 88, status: 'attention' },
    { name: 'Documentation', score: 97, status: 'compliant' },
  ],
  recentFindings: [
    { id: 1, type: 'observation', description: 'Update emergency exit signage in Building B', dueDate: 'Feb 28, 2025' },
    { id: 2, type: 'recommendation', description: 'Consider adding more hands-on training hours', dueDate: 'Mar 15, 2025' },
  ],
};

export default function AccreditationReportPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Report" }]} />
      </div>
<div className="max-w-6xl mx-auto">
        <Link href="/admin/accreditation" className="flex items-center gap-2 text-gray-600 hover:text-brand-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Accreditation
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Accreditation Compliance Report</h1>
            <p className="text-gray-600">Generated: {new Date().toLocaleDateString()}</p>
          </div>
          <button className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-24 h-24 mx-auto mb-4 relative">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle cx="48" cy="48" r="40" stroke="#9333ea" strokeWidth="8" fill="none"
                  strokeDasharray={`${reportData.overallScore * 2.51} 251`} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-gray-900">
                {reportData.overallScore}%
              </span>
            </div>
            <p className="font-semibold text-gray-900">Overall Compliance</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Calendar className="w-8 h-8 text-green-600 mb-3" />
            <p className="text-sm text-gray-500">Last Audit</p>
            <p className="text-xl font-bold text-gray-900">{reportData.lastAudit}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Clock className="w-8 h-8 text-brand-blue-600 mb-3" />
            <p className="text-sm text-gray-500">Next Audit</p>
            <p className="text-xl font-bold text-gray-900">{reportData.nextAudit}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Compliance by Category</h2>
          <div className="space-y-4">
            {reportData.categories.map((cat, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-48 font-medium text-gray-700">{cat.name}</div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${cat.status === 'compliant' ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 text-right font-bold text-gray-900">{cat.score}%</div>
                {cat.status === 'compliant' ? (
                  <span className="text-slate-400 flex-shrink-0">•</span>
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Action Items</h2>
          <div className="space-y-4">
            {reportData.recentFindings.map((finding) => (
              <div key={finding.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  finding.type === 'observation' ? 'bg-yellow-100 text-yellow-700' : 'bg-brand-blue-100 text-brand-blue-700'
                }`}>
                  {finding.type}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900">{finding.description}</p>
                  <p className="text-sm text-gray-500 mt-1">Due: {finding.dueDate}</p>
                </div>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition text-sm">
                  Mark Complete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
