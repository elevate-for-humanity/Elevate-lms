import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import CourseBuilderClient from './CourseBuilderClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/course-builder' },
  title: 'Course Builder | Elevate For Humanity',
  description: 'Create and manage courses for your programs.',
};

export default async function CourseBuilderPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  // Fetch courses from database
  const { data: courses } = await db
    .from('courses')
    .select('*, programs(id, title)')
    .order('created_at', { ascending: false });

  // Fetch programs for dropdown
  const { data: programs } = await db
    .from('programs')
    .select('id, title')
    .order('title');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Course Builder' }]} />
        </div>
      </div>
      <CourseBuilderClient initialCourses={courses || []} programs={programs || []} />
    </div>
  );
}
