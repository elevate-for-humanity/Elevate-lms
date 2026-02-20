
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Program Holder Documentation | Elevate For Humanity',
  description: 'Guide for program holders and training providers.',
};

const sections = [
  { title: 'Getting Started', href: '/docs/program-holders/getting-started' },
  { title: 'Managing Programs', href: '/docs/program-holders/programs' },
  { title: 'Student Enrollment', href: '/docs/program-holders/enrollment' },
  { title: 'Reporting', href: '/docs/program-holders/reporting' },
];

export default function ProgramHoldersDocsPage() {

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Documentation', href: '/docs' }, { label: 'Program Holders' }]} />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Program Holder Documentation</h1>
        <div className="bg-white rounded-xl shadow-sm border divide-y">
          {sections.map((section, i) => (
            <Link key={i} href={section.href} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <span className="font-medium text-gray-900">{section.title}</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
