import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Quiz | Elevate For Humanity',
  description: 'Test your knowledge with this quiz.',
};

export default async function QuizPage({ params }: { params: { courseId: string; lessonId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: lesson } = await supabase.from('training_lessons').select('*').eq('id', params.lessonId).single();
  const { data: quiz } = await supabase.from('quizzes').select('*').eq('lesson_id', params.lessonId).single();
  const { data: questions } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quiz?.id).order('order_index');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/lms/courses/${params.courseId}/lessons/${params.lessonId}`} className="text-brand-blue-600 hover:text-brand-blue-800 text-sm">← Back to Lesson</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{lesson?.title} - Quiz</h1>
          <p className="text-gray-600 mt-1">Test your understanding of this lesson</p>
        </div>
        {quiz ? (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div>
                <h2 className="font-semibold">{quiz.title || 'Lesson Quiz'}</h2>
                <p className="text-sm text-gray-500">{questions?.length || 0} questions • {quiz.passing_score || 70}% to pass</p>
              </div>
              {quiz.time_limit && <span className="text-sm text-gray-500">Time limit: {quiz.time_limit} min</span>}
            </div>
            <div className="space-y-6">
              {questions && questions.length > 0 ? questions.map((q: any, i: number) => (
                <div key={q.id} className="p-4 border rounded-lg">
                  <p className="font-medium mb-3">{i + 1}. {q.question_text}</p>
                  {q.question_type === 'multiple_choice' && q.options && (
                    <div className="space-y-2">
                      {JSON.parse(q.options).map((opt: string, j: number) => (
                        <label key={j} className="flex items-center gap-2 p-2 rounded hover:bg-white cursor-pointer">
                          <input type="radio" name={`q-${q.id}`} className="w-4 h-4" />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {q.question_type === 'true_false' && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 p-2 rounded hover:bg-white cursor-pointer"><input type="radio" name={`q-${q.id}`} className="w-4 h-4" /><span>True</span></label>
                      <label className="flex items-center gap-2 p-2 rounded hover:bg-white cursor-pointer"><input type="radio" name={`q-${q.id}`} className="w-4 h-4" /><span>False</span></label>
                    </div>
                  )}
                </div>
              )) : <p className="text-gray-500 text-center py-4">No questions available</p>}
            </div>
            <button className="w-full mt-6 bg-brand-blue-600 text-white px-4 py-3 rounded-lg hover:bg-brand-blue-700 font-medium">Submit Quiz</button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <p className="text-gray-500">No quiz available for this lesson</p>
            <Link href={`/lms/courses/${params.courseId}/lessons/${params.lessonId}`} className="text-brand-blue-600 hover:text-brand-blue-800 mt-2 inline-block">Return to Lesson</Link>
          </div>
        )}
      </div>
    </div>
  );
}
