export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Admin Documentation | Elevate For Humanity',
  description: 'Documentation and guides for administrators.',
};

const sections = [
  { title: 'Getting Started', href: '/docs/admins/getting-started' },
  { title: 'User Management', href: '/docs/admins/users' },
  { title: 'Course Management', href: '/docs/admins/courses' },
  { title: 'Reports & Analytics', href: '/docs/admins/reports' },
  { title: 'System Settings', href: '/docs/admins/settings' },
];

export default async function AdminDocsPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('documentation').select('*').limit(50);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Documentation', href: '/docs' }, { label: 'Admin Guide' }]} />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Documentation</h1>
        <div className="bg-white rounded-xl shadow-sm border divide-y">
          {sections.map((section, i) => (
            <Link key={i} href={section.href} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <span className="font-medium text-gray-900">{section.title}</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
        </div>
        <div className="mt-8 p-6 bg-brand-blue-50 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 text-sm mb-4">Contact support for assistance.</p>
          <Link href="/contact" className="text-brand-blue-600 hover:underline font-medium">Contact Support →</Link>
        </div>
      </div>
    </div>
  );
}
