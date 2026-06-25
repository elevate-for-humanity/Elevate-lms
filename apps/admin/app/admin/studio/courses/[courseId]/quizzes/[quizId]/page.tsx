import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckSquare, Clock, Target, Shuffle, Edit3, Plus, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string; quizId: string }>;
}): Promise<Metadata> {
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  short_answer: 'Short Answer',
  matching: 'Matching',
  fill_blank: 'Fill in the Blank',
};

export default async function QuizPage({
  params,
}: {
  params: Promise<{ courseId: string; quizId: string }>;
}) {
  await requireRole(['admin', 'instructor']);
  const { courseId, quizId } = await params;
  const supabase = await createClient();

  const [{ data: quiz }, { data: questions }, { data: course }] = await Promise.all([
    supabase.from('quizzes').select('*').eq('id', quizId).maybeSingle(),
    supabase
      .from('quiz_questions')
      .select('id, question_type, question_text, points, order_index, explanation')
      .eq('quiz_id', quizId)
      .order('order_index'),
    supabase.from('courses').select('id, title').eq('id', courseId).maybeSingle(),
  ]);

  if (!quiz) notFound();

  const questionRows = questions ?? [];
  const totalPoints = questionRows.reduce((sum, q) => sum + (q.points ?? 1), 0);

  const byType: Record<string, number> = {};
  for (const q of questionRows) {
    byType[q.question_type] = (byType[q.question_type] ?? 0) + 1;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-1">
              <Link href="/admin/courses" className="hover:text-blue-600">
                Courses
              </Link>
              {course && (
                <>
                  {' '}
                  /{' '}
                  <Link href={`/admin/courses/${courseId}`} className="hover:text-blue-600">
                    {course.title}
                  </Link>
                </>
              )}{' '}
              / Quizzes / {quiz.title}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-slate-500 text-sm mt-0.5">{quiz.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/courses/${courseId}/quizzes/${quizId}/questions`}
              className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <Edit3 className="w-4 h-4" /> Manage Questions
            </Link>
            <Link
              href={`/admin/courses/${courseId}/quizzes/${quizId}/questions/new`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Question
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Quiz settings */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Questions', value: questionRows.length, icon: CheckSquare },
            { label: 'Total Points', value: totalPoints, icon: Target },
            { label: 'Passing Score', value: `${quiz.passing_score ?? 70}%`, icon: Target },
            {
              label: 'Time Limit',
              value: quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : 'None',
              icon: Clock,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-slate-200 p-5 text-center"
            >
              <p className="text-3xl font-bold text-blue-600">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Settings detail */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Quiz Settings</h2>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-slate-400 text-xs">Max Attempts</dt>
              <dd className="font-medium text-slate-900 mt-0.5">{quiz.max_attempts ?? 3}</dd>
            </div>
            <div>
              <dt className="text-slate-400 text-xs flex items-center gap-1">
                <Shuffle className="w-3 h-3" /> Shuffle Questions
              </dt>
              <dd className="font-medium text-slate-900 mt-0.5">
                {quiz.shuffle_questions ? 'Yes' : 'No'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 text-xs">Show Correct Answers</dt>
              <dd className="font-medium text-slate-900 mt-0.5">
                {quiz.show_correct_answers ? 'Yes' : 'No'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 text-xs">Published</dt>
              <dd className="mt-0.5">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    quiz.is_published
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {quiz.is_published ? 'Published' : 'Draft'}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Question type breakdown */}
        {Object.keys(byType).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(byType).map(([type, count]) => (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-medium"
              >
                {QUESTION_TYPE_LABELS[type] ?? type} ({count})
              </span>
            ))}
          </div>
        )}

        {/* Questions list */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Questions ({questionRows.length})</h2>
            <Link
              href={`/admin/courses/${courseId}/quizzes/${quizId}/questions`}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              Full editor <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {questionRows.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No questions yet.{' '}
              <Link
                href={`/admin/courses/${courseId}/quizzes/${quizId}/questions/new`}
                className="text-blue-600 hover:underline"
              >
                Add one
              </Link>
              .
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {questionRows.map((q, i) => (
                <div key={q.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <div className="font-medium text-slate-900">{q.question_text}</div>
                        {q.explanation && (
                          <div className="text-xs text-slate-400 mt-1">
                            Explanation: {q.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        {q.points ?? 1} pt{(q.points ?? 1) !== 1 ? 's' : ''}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                        {QUESTION_TYPE_LABELS[q.question_type] ?? q.question_type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
