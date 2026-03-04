import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
  const _admin = createAdminClient(); const db = _admin || supabase;

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

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['admin', 'super_admin', 'instructor'].includes(profile?.role || '')) {
    redirect('/unauthorized');
  }

  const { data: categories } = await db
    .from('course_categories')
    .select('id, name')
    .order('name');

  const { data: programs } = await db
    .from('programs')
    .select('id, title')
    .order('title');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/admin-courses-create-hero.jpg" alt="Create course" fill sizes="100vw" className="object-cover" priority />
      </section>
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
