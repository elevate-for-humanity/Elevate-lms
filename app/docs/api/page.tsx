import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Code, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'API Documentation | Elevate For Humanity',
  description: 'API reference and integration guides.',
};

const sections = [
  { title: 'Authentication', href: '/docs/api/auth' },
  { title: 'Endpoints Reference', href: '/docs/api/endpoints' },
  { title: 'Webhooks', href: '/docs/api/webhooks' },
  { title: 'Rate Limits', href: '/docs/api/rate-limits' },
  { title: 'Examples', href: '/docs/api/examples' },
];

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Documentation', href: '/docs' }, { label: 'API' }]} />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Code className="w-10 h-10 text-brand-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
        </div>
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
