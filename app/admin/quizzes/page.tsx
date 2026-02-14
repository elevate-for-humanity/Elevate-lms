import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Quizzes Management | Admin',
  description: 'Manage course quizzes and assessments',
};

export default async function QuizzesPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  const { data: quizzes, count: totalQuizzes } = await supabase
    .from('quizzes')
    .select('id, title, course_id, passing_score, time_limit, created_at, updated_at', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .limit(100);

  // Get courses for display names
  const courseIds = [...new Set((quizzes || []).map(q => q.course_id).filter(Boolean))];
  const { data: courses } = courseIds.length > 0
    ? await supabase.from('courses').select('id, title').in('id', courseIds)
    : { data: [] };

  const courseMap = new Map((courses || []).map(c => [c.id, c.title]));

  // Count questions per quiz
  const { data: questionCounts } = await supabase
    .from('quiz_questions')
    .select('quiz_id');

  const questionCountMap = new Map<string, number>();
  (questionCounts || []).forEach(q => {
    questionCountMap.set(q.quiz_id, (questionCountMap.get(q.quiz_id) || 0) + 1);
  });

  // Count attempts
  const { count: totalAttempts } = await supabase
    .from('quiz_attempts')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Quizzes' }]} />
      </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-black">Quizzes Management</h1>
              <p className="text-black mt-1">Manage assessments and quizzes across all courses</p>
            </div>
            <Link
              href="/admin/quiz-builder"
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              + Create Quiz
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Total Quizzes</h3>
              <p className="text-base md:text-lg font-bold text-black">{totalQuizzes || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Total Questions</h3>
              <p className="text-base md:text-lg font-bold text-brand-blue-600">{questionCounts?.length || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Total Attempts</h3>
              <p className="text-base md:text-lg font-bold text-brand-green-600">{totalAttempts || 0}</p>
            </div>
          </div>
        </div>

        {/* Quizzes Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Passing Score</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Time Limit</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(quizzes || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No quizzes found.{' '}
                      <Link href="/admin/quiz-builder" className="text-brand-blue-600 hover:underline">Create your first quiz</Link>.
                    </td>
                  </tr>
                ) : (
                  (quizzes || []).map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{quiz.title || 'Untitled'}</div>
                        <div className="text-xs text-gray-400 font-mono">{quiz.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {quiz.course_id ? (
                          <Link href={`/admin/courses/${quiz.course_id}/quizzes`} className="text-brand-blue-600 hover:underline">
                            {courseMap.get(quiz.course_id) || quiz.course_id.slice(0, 8)}
                          </Link>
                        ) : (
                          <span className="text-gray-400">Standalone</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {questionCountMap.get(quiz.id) || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {quiz.passing_score ? `${quiz.passing_score}%` : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {quiz.time_limit ? `${quiz.time_limit} min` : 'None'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {quiz.updated_at ? new Date(quiz.updated_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href="/admin/quiz-builder"
                          className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
