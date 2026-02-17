import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CreateCourseForm } from './CreateCourseForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Create Course | Admin | Elevate LMS',
  description: 'Create a new course.',
};

export default async function CreateCoursePage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900">Service Unavailable</h1>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['admin', 'super_admin', 'instructor'].includes(profile?.role || '')) {
    redirect('/unauthorized');
  }

  const { data: categories } = await supabase
    .from('course_categories')
    .select('id, name')
    .order('name');

  const { data: programs } = await supabase
    .from('programs')
    .select('id, title')
    .order('title');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <nav className="text-sm mb-6">
          <ol className="flex items-center space-x-2 text-gray-500">
            <li>
              <Link href="/admin" className="hover:text-brand-blue-600">
                Admin
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/admin/courses" className="hover:text-brand-blue-600">
                Courses
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Create</li>
          </ol>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Course</h1>

        <CreateCourseForm
          categories={categories || []}
          programs={programs || []}
        />
      </div>
    </div>
  );
}
