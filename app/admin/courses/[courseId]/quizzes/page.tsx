import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import QuizManagerClient from './QuizManagerClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Course Quizzes | Elevate For Humanity',
  description: 'Manage quizzes and assessments for this course.',
};

export default async function CourseQuizzesPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { data: course } = await supabase.from('training_courses').select('*').eq('id', courseId).single();
  const { data: quizzes } = await supabase.from('quizzes').select('*').eq('course_id', courseId).order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li><Link href="/admin/course-builder" className="hover:text-primary">Course Builder</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Quizzes</li>
            </ol>
          </nav>
        </div>
        <QuizManagerClient course={course} initialQuizzes={quizzes || []} courseId={courseId} />
      </div>
    </div>
  );
}
