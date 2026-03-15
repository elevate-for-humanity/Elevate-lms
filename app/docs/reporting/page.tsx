
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Reporting Documentation | Elevate For Humanity',
  description: 'Guide to reports and analytics.',
};

const sections = [
  { title: 'Available Reports', href: '/docs/reporting/available' },
  { title: 'Custom Reports', href: '/docs/reporting/custom' },
  { title: 'Exporting Data', href: '/docs/reporting/export' },
  { title: 'Compliance Reports', href: '/docs/reporting/compliance' },
];

export default function ReportingDocsPage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Documentation', href: '/docs' }, { label: 'Reporting' }]} />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Reporting Documentation</h1>
        <div className="bg-white rounded-xl shadow-sm border divide-y">
          {sections.map((section, i) => (
            <Link key={i} href={section.href} className="flex items-center justify-between p-4 hover:bg-white">
              <span className="font-medium text-gray-900">{section.title}</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
