import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EnrollCourseClient from './EnrollCourseClient';

export const dynamic = 'force-dynamic';

export default async function CourseEnrollPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/lms/courses/${courseId}/enroll`);

  const { data: courseRow } = await supabase
    .from('courses')
    .select('id, title, slug, status, is_active')
    .or(`id.eq.${courseId},slug.eq.${courseId}`)
    .maybeSingle();

  if (!courseRow || courseRow.status === 'archived' || !courseRow.is_active) notFound();

  const { data: existing } = await supabase
    .from('program_enrollments')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('course_id', courseRow.id)
    .maybeSingle();

  if (existing?.status === 'active') redirect(`/lms/courses/${courseRow.id}`);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <EnrollCourseClient courseId={courseRow.id} courseTitle={courseRow.title || 'this course'} />
    </main>
  );
}
