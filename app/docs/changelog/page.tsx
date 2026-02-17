import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FileText, ArrowLeft, Tag, Calendar } from 'lucide-react';

const releases = [
  { version: '2.5.0', date: 'January 15, 2026', type: 'feature', changes: ['Added PWA support for all portals', 'Enhanced FAQ with search highlighting', 'New financial assurance tracking', 'Program catalog PDF generator'] },
  { version: '2.4.0', date: 'January 10, 2026', type: 'feature', changes: ['Stripe webhook idempotency', 'Improved enrollment flow', 'Course leaderboards', 'Instructor analytics charts'] },
  { version: '2.3.1', date: 'January 5, 2026', type: 'fix', changes: ['Fixed enrollment status sync', 'Resolved certificate generation issues', 'Performance improvements'] },
  { version: '2.3.0', date: 'December 20, 2025', type: 'feature', changes: ['Video captions support', 'Student progress tracking', 'Notification system', 'Mobile responsive improvements'] },
  { version: '2.2.0', date: 'December 1, 2025', type: 'feature', changes: ['Multi-tenant support', 'Partner portal launch', 'WIOA compliance reports', 'Bulk student import'] },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Changelog" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4">
        <Link href="/docs" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Docs
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-brand-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Changelog</h1>
            <p className="text-gray-600">Platform updates and release notes</p>
          </div>
        </div>
        <div className="space-y-6">
          {releases.map((release, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${release.type === 'feature' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {release.type === 'feature' ? 'New Features' : 'Bug Fixes'}
                </span>
                <div className="flex items-center gap-2 text-gray-500">
                  <Tag className="w-4 h-4" /> v{release.version}
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="w-4 h-4" /> {release.date}
                </div>
              </div>
              <ul className="space-y-2">
                {release.changes.map((change, j) => (
                  <li key={j} className="flex items-start gap-2 text-gray-700">
                    <span className="text-brand-blue-500 mt-1">•</span> {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
