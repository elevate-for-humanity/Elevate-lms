import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import EPA608PracticeCenter from './EPA608PracticeCenter';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'EPA 608 Practice Center',
  description: 'Practice Core and EPA Section 608 Types I, II, and III with saved readiness results.',
};

export default async function EPA608PracticePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/programs/hvac-technician/practice');

  const db = await requireAdminClient();
  const { data: course } = await db.from('courses').select('id').eq('slug', 'hvac-technician').eq('is_active', true).maybeSingle();
  if (!course) notFound();

  const { data: enrollment } = await db
    .from('course_enrollments')
    .select('id')
    .eq('course_id', course.id)
    .eq('student_id', user.id)
    .eq('status', 'active')
    .maybeSingle();
  if (!enrollment) redirect('/lms/dashboard');

  return <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6"><div className="mx-auto max-w-5xl"><EPA608PracticeCenter courseId={String(course.id)} /></div></main>;
}
