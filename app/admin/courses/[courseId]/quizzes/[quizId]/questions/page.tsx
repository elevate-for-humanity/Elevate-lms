import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import QuestionManagerClient from './QuestionManagerClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Quiz Questions | Elevate For Humanity',
  description: 'Manage quiz questions and answers.',
};

export default async function QuizQuestionsPage({
  await requireRole(['admin', 'super_admin']); params }: { params: Promise<{ courseId: string; quizId: string }> }) {
  const { courseId, quizId } = await params;
  const supabase = await createClient();



  const { data: quiz } = await supabase.from('quizzes').select('*').eq('id', quizId).single();
  const { data: questions } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quizId).order('order_index');

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li><Link href="/admin/course-builder" className="hover:text-primary">Course Builder</Link></li>
              <li>/</li>
              <li><Link href={`/admin/courses/${courseId}/quizzes`} className="hover:text-primary">Quizzes</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Questions</li>
            </ol>
          </nav>
        </div>
        <QuestionManagerClient quiz={quiz} initialQuestions={questions || []} quizId={quizId} courseId={courseId} />
      </div>
    </div>
  );
}
