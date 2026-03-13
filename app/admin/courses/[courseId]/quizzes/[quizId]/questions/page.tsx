import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import QuestionManagerClient from './QuestionManagerClient';

export const metadata: Metadata = {
  title: 'Quiz Questions | Elevate For Humanity',
  description: 'Manage quiz questions and answers.',
};

export default async function QuizQuestionsPage({ params }: { params: Promise<{ courseId: string; quizId: string }> }) {
  const { courseId, quizId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { data: quiz } = await db.from('quizzes').select('*').eq('id', quizId).single();
  const { data: questions } = await db.from('quiz_questions').select('*').eq('quiz_id', quizId).order('order_index');

  return (
    <div className="min-h-screen bg-gray-50">

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
