export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'LMS Documentation | Elevate For Humanity',
  description: 'Complete guide to LMS features and functionality.',
};

const sections = [
  { title: 'Dashboard Overview', href: '/docs/lms/dashboard' },
  { title: 'Courses & Enrollment', href: '/docs/lms/courses' },
  { title: 'Progress Tracking', href: '/docs/lms/progress' },
  { title: 'Certificates', href: '/docs/lms/certificates' },
  { title: 'Gamification', href: '/docs/lms/gamification' },
];

export default async function LmsDocsPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('documentation').select('*').limit(50);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Documentation', href: '/docs' }, { label: 'LMS Features' }]} />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">LMS Documentation</h1>
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
