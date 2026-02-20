export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ChevronRight, GraduationCap } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Student Guide | Elevate For Humanity',
  description: 'Complete guide for students using the Elevate platform.',
};

const sections = [
  { title: 'Getting Started', href: '/docs/students/getting-started' },
  { title: 'Enrolling in Courses', href: '/docs/students/enrollment' },
  { title: 'Taking Courses', href: '/docs/students/courses' },
  { title: 'Tracking Progress', href: '/docs/students/progress' },
  { title: 'Earning Certificates', href: '/docs/students/certificates' },
  { title: 'Getting Help', href: '/docs/students/help' },
];

export default async function StudentDocsPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('documentation').select('*').limit(50);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Documentation', href: '/docs' }, { label: 'Student Guide' }]} />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <GraduationCap className="w-10 h-10 text-brand-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Student Guide</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm border divide-y">
          {sections.map((section, i) => (
            <Link key={i} href={section.href} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <span className="font-medium text-gray-900">{section.title}</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
        </div>
        <div className="mt-8 p-6 bg-brand-green-50 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-2">Ready to Start Learning?</h3>
          <p className="text-gray-600 text-sm mb-4">Browse our programs and enroll today.</p>
          <Link href="/programs" className="text-brand-green-600 hover:underline font-medium">View Programs →</Link>
        </div>
      </div>
    </div>
  );
}
