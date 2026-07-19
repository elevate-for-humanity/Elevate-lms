import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { EditCourseForm } from './EditCourseForm';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Edit Course | Admin | Elevate LMS',
};

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();


  // Guard against null user
  if (!user) redirect('/login');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!['admin', 'instructor'].includes(profile?.role || '')) {
    redirect('/unauthorized');
  }

  // Try canonical courses table first, fall back to legacy training_courses
  let course: Record<string, unknown> | null = null;

  const { data: canonicalCourse } = await supabase
    .from('courses')
    .select('id, title, slug, short_description, description, status, program_id, created_at, updated_at')
    .eq('id', courseId)
    .maybeSingle();

  if (canonicalCourse) {
    course = { ...canonicalCourse, _source: 'courses' };
  } else {
    const { data: legacyCourse } = await supabase
      .from('lms_courses')
      .select('*')
      .eq('id', courseId)
      .maybeSingle();
    if (legacyCourse) course = { ...legacyCourse, _source: 'training_courses' };
  }

  if (!course) notFound();

  const { data: programs } = await supabase.from('programs').select('id, title').order('title');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <nav className="text-sm mb-6">
          <ol className="flex items-center space-x-2 text-slate-700">
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
            <li className="text-slate-900 font-medium">Edit</li>
          </ol>
        </nav>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit: {course.title}</h1>

        <EditCourseForm course={course} programs={programs || []} />
      </div>
    </div>
  );
}
