import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GradebookClient } from './GradebookClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gradebook | Admin | Elevate LMS',
  description: 'Grade student submissions and manage course grades.',
};

export default async function AdminGradebookPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(\'/login\');



  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['admin', 'super_admin', 'instructor'].includes(profile?.role || '')) {
    redirect('/unauthorized');
  }

  // Fetch course
  const { data: course } = await supabase
    .from('training_courses')
    .select('id, title')
    .eq('id', courseId)
    .single();

  if (!course) redirect('/admin/courses');

  // Fetch enrollments with student profiles
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select('id, user_id, progress, status, profiles!inner(full_name, email)')
    .eq('course_id', courseId)
    .order('created_at');

  // Fetch assignment submissions for this course
  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('*')
    .eq('course_id', courseId)
    .order('submitted_at', { ascending: false });

  // Fetch quiz attempts for this course
  const { data: quizAttempts } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Gradebook: {course.title}
          </h1>
        </div>

        <GradebookClient
          courseId={courseId}
          enrollments={(enrollments || []) as any[]}
          submissions={submissions || []}
          quizAttempts={quizAttempts || []}
        />
      </div>
    </div>
  );
}
