import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import QuizManagerClient from './QuizManagerClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Course Quizzes | Elevate For Humanity',
  description: 'Manage quizzes and assessments for this course.',
};

export default async function CourseQuizzesPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireRole(['admin', 'super_admin', 'staff']);
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from('lms_courses')
    .select('*')
    .eq('id', courseId)
    .maybeSingle();
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-slate-700">
              <li>
                <Link href="/admin" className="hover:text-primary">
                  Admin
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/admin/studio" className="hover:text-primary">
                  Course Builder
                </Link>
              </li>
              <li>/</li>
              <li className="text-slate-900 font-medium">Quizzes</li>
            </ol>
          </nav>
        </div>
        <QuizManagerClient course={course} initialQuizzes={quizzes || []} courseId={courseId} />
      </div>
    </div>
  );
}
