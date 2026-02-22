import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  Clock, 
  
  XCircle, 
  AlertCircle,
  ArrowLeft,
  Play,
  Trophy,
  Target,
  FileText
} from 'lucide-react';
import QuizTakingInterface from './QuizTakingInterface';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ quizId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { quizId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  if (!supabase) {
    return { title: 'Quiz | Elevate LMS' };
  }

  const { data: quiz } = await db
    .from('quizzes')
    .select('title, description')
    .eq('id', quizId)
    .single();

  return {
    title: quiz?.title ? `${quiz.title} | Elevate LMS` : 'Quiz | Elevate LMS',
    description: quiz?.description || 'Take this quiz to test your knowledge.',
  };
}

export default async function QuizPage({ params }: Props) {
  const { quizId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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

  if (!user) {
    redirect('/login?redirect=/lms/quizzes/' + quizId);
  }

  // Fetch quiz with questions
  const { data: quiz, error: quizError } = await db
    .from('quizzes')
    .select(`
      id,
      title,
      description,
      course_id,
      time_limit_minutes,
      passing_score,
      max_attempts,
      shuffle_questions,
      show_correct_answers,
      created_at,
      courses (
        id,
        title
      )
    `)
    .eq('id', quizId)
    .single();

  if (quizError || !quiz) {
    notFound();
  }

  // Fetch questions for this quiz
  const { data: questions } = await db
    .from('quiz_questions')
    .select(`
      id,
      question_text,
      question_type,
      points,
      order_index,
      quiz_answers (
        id,
        answer_text,
        is_correct,
        order_index
      )
    `)
    .eq('quiz_id', quizId)
    .order('order_index', { ascending: true });

  // Fetch user's previous attempts
  const { data: attempts } = await db
    .from('quiz_attempts')
    .select('*')
    .eq('quiz_id', quizId)
    .eq('user_id', user.id)
    .order('started_at', { ascending: false });

  const completedAttempts = attempts?.filter(a => a.completed_at) || [];
  const inProgressAttempt = attempts?.find(a => !a.completed_at);
  const bestScore = completedAttempts.length > 0 
    ? Math.max(...completedAttempts.map(a => a.score || 0))
    : null;
  const attemptsRemaining = quiz.max_attempts 
    ? quiz.max_attempts - completedAttempts.length 
    : null;
  const canTakeQuiz = attemptsRemaining === null || attemptsRemaining > 0;
  const hasPassed = bestScore !== null && bestScore >= (quiz.passing_score || 70);

  // Calculate total points
  const totalPoints = questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 0;

  // If there's an in-progress attempt, show the quiz interface
  if (inProgressAttempt && questions && questions.length > 0) {
    return (
      <QuizTakingInterface 
        quiz={quiz}
        questions={questions}
        attemptId={inProgressAttempt.id}
        visitorId={user.id}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Link */}
        <Link 
          href="/lms/quizzes" 
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quizzes
        </Link>

        {/* Quiz Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{quiz.title}</h1>
              {quiz.courses && (
                <Link 
                  href={`/lms/courses/${quiz.course_id}`}
                  className="text-brand-blue-600 hover:underline text-sm"
                >
                  {(quiz.courses as { id: string; title: string }).title}
                </Link>
              )}
            </div>
            {hasPassed && (
              <div className="flex items-center gap-2 bg-brand-green-100 text-brand-green-800 px-4 py-2 rounded-full">
                <Trophy className="w-5 h-5" />
                <span className="font-semibold">Passed</span>
              </div>
            )}
          </div>

          {quiz.description && (
            <p className="text-slate-600 mb-6">{quiz.description}</p>
          )}

          {/* Quiz Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Questions</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{questions?.length || 0}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Time Limit</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : 'None'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-sm">Passing Score</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{quiz.passing_score || 70}%</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-sm">Total Points</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{totalPoints}</p>
            </div>
          </div>

          {/* Attempts Info */}
          {quiz.max_attempts && (
            <div className={`rounded-xl p-4 mb-6 ${
              attemptsRemaining === 0 
                ? 'bg-brand-red-50 border border-brand-red-200' 
                : 'bg-brand-blue-50 border border-brand-blue-200'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className={`w-5 h-5 ${
                  attemptsRemaining === 0 ? 'text-brand-red-600' : 'text-brand-blue-600'
                }`} />
                <span className={attemptsRemaining === 0 ? 'text-brand-red-800' : 'text-brand-blue-800'}>
                  {attemptsRemaining === 0 
                    ? 'You have used all available attempts for this quiz.'
                    : `You have ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`
                  }
                </span>
              </div>
            </div>
          )}

          {/* Start Quiz Button */}
          {canTakeQuiz && questions && questions.length > 0 ? (
            <form action={`/api/lms/quizzes/${quizId}/start`} method="POST">
              <button
                type="submit"
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-brand-blue-700 transition"
              >
                <Play className="w-5 h-5" />
                {completedAttempts.length > 0 ? 'Retake Quiz' : 'Start Quiz'}
              </button>
            </form>
          ) : !questions || questions.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-800">This quiz has no questions yet.</p>
            </div>
          ) : null}
        </div>

        {/* Previous Attempts */}
        {completedAttempts.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Previous Attempts</h2>
            <div className="space-y-3">
              {completedAttempts.map((attempt, index) => {
                const passed = (attempt.score || 0) >= (quiz.passing_score || 70);
                return (
                  <Link
                    key={attempt.id}
                    href={`/lms/quizzes/${quizId}/results/${attempt.id}`}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        passed ? 'bg-brand-green-100' : 'bg-brand-red-100'
                      }`}>
                        {passed 
                          ? <span className="text-slate-400 flex-shrink-0">•</span>
                          : <XCircle className="w-5 h-5 text-brand-red-600" />
                        }
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          Attempt {completedAttempts.length - index}
                        </p>
                        <p className="text-sm text-slate-600">
                          {new Date(attempt.completed_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        passed ? 'text-brand-green-600' : 'text-brand-red-600'
                      }`}>
                        {attempt.score}%
                      </p>
                      <p className="text-sm text-slate-600">
                        {passed ? 'Passed' : 'Not Passed'}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
