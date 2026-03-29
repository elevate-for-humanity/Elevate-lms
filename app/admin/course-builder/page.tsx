import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/authGuards';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import CourseBuilderClient from './CourseBuilderClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/course-builder' },
  title: 'Course Builder | Elevate For Humanity',
  description: 'Create and manage courses for your programs.',
};

export default async function CourseBuilderPage() {
  await requireAdmin(); // enforces admin/super_admin/staff, redirects on failure

  const supabase = await createClient();

  // Fetch courses from database
  const { data: courses } = await supabase
    .from('courses')
    .select('*, programs(id, title)')
    .order('created_at', { ascending: false });

  // Fetch programs for dropdown
  const { data: programs } = await supabase
    .from('programs')
    .select('id, title')
    .order('title');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Course Builder' }]} />
        </div>
      </div>
      <CourseBuilderClient initialCourses={courses || []} programs={programs || []} />
    </div>
  );
}
