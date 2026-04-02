import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  XCircle,
  ArrowLeft,
  RotateCcw,
  Home,
  Clock,
  Target,
  Award,
CheckCircle, } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ quizId: string; attemptId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Quiz Results | Elevate LMS',
    description: 'View your quiz results and performance.',
  };
}

export default async function QuizResultsPage({ params }: Props) {
  const { quizId, attemptId } = await params;
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/lms/quizzes/' + quizId + '/results/' + attemptId);
  }

  // Fetch attempt with quiz details
  const { data: attempt, error: attemptError } = await supabase
    .from('quiz_attempts')
    .select(`
      *,
      quizzes (
        id,
        title,
        description,
        passing_score,
        show_correct_answers,
        max_attempts,
        course_id,
        courses (
          id,
          title
        )
      )
    `)
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .single();

  if (attemptError || !attempt) {
    notFound();
  }

  // Fetch attempt answers with question details
  const { data: attemptAnswers } = await supabase
    .from('quiz_attempt_answers')
    .select(`
      *,
      quiz_questions (
        id,
        question_text,
        points,
        quiz_answers (
          id,
          answer_text,
          is_correct
        )
      )
    `)
    .eq('attempt_id', attemptId)
    .order('created_at', { ascending: true });

  // Get total attempts for this quiz
  const { count: totalAttempts } = await supabase
    .from('quiz_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('quiz_id', quizId)
    .eq('user_id', user.id)
    .not('completed_at', 'is', null);

  const quiz = attempt.quizzes as {
    id: string;
    title: string;
    description: string | null;
    passing_score: number | null;
    show_correct_answers: boolean;
    max_attempts: number | null;
    course_id: string | null;
    courses: { id: string; title: string } | null;
  };

  const passed = attempt.passed;
  const score = attempt.score || 0;
  const passingScore = quiz.passing_score || 70;
  const canRetake = !quiz.max_attempts || (totalAttempts || 0) < quiz.max_attempts;

  // Calculate time taken
  const startTime = new Date(attempt.started_at).getTime();
  const endTime = new Date(attempt.completed_at).getTime();
  const timeTakenMs = endTime - startTime;
  const timeTakenMinutes = Math.floor(timeTakenMs / 60000);
  const timeTakenSeconds = Math.floor((timeTakenMs % 60000) / 1000);

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Link */}
        <Link
          href="/lms/quizzes"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quizzes
        </Link>

        {/* Results Header */}
        <div className={`rounded-2xl p-8 mb-8 ${
          passed
            ? 'bg-emerald-700'
            : 'bg-brand-red-700'
        } text-white`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
              {quiz.courses && (
                <p className="text-white/80">{quiz.courses.title}</p>
              )}
            </div>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              passed ? 'bg-emerald-600' : 'bg-brand-red-600'
            }`}>
              {passed ? (
                <Trophy className="w-10 h-10" />
              ) : (
                <XCircle className="w-10 h-10" />
              )}
            </div>
          </div>

          <div className="text-center py-6">
            <p className="text-white/80 text-lg mb-2">Your Score</p>
            <p className="text-7xl font-bold mb-2">{score}%</p>
            <p className="text-xl font-semibold">
              {passed ? '✓ You passed!' : `✕ You need ${passingScore}% to pass`}
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Target className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{attempt.points_earned || 0}/{attempt.points_possible || 0}</p>
              <p className="text-sm text-white/80">Points Earned</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{timeTakenMinutes}:{timeTakenSeconds.toString().padStart(2, '0')}</p>
              <p className="text-sm text-white/80">Time Taken</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Award className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{passingScore}%</p>
              <p className="text-sm text-white/80">Passing Score</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          {canRetake && !passed && (
            <Link
              href={`/lms/quizzes/${quizId}`}
              className="flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-semibold hover:bg-brand-blue-700 transition"
            >
              <RotateCcw className="w-5 h-5" />
              Retake Quiz
            </Link>
          )}
          {quiz.course_id && (
            <Link
              href={`/lms/courses/${quiz.course_id}`}
              className="flex items-center gap-2 px-6 py-3 border border-slate-300 rounded-xl font-semibold hover:bg-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Course
            </Link>
          )}
          <Link
            href="/lms/dashboard"
            className="flex items-center gap-2 px-6 py-3 border border-slate-300 rounded-xl font-semibold hover:bg-white transition"
          >
            <Home className="w-5 h-5" />
            Dashboard
          </Link>
        </div>

        {/* Question Review */}
        {quiz.show_correct_answers && attemptAnswers && attemptAnswers.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Question Review</h2>
            <div className="space-y-6">
              {attemptAnswers.map((answer, index) => {
                const question = answer.quiz_questions;
                if (!question) return null;

                const selectedAnswer = question.quiz_answers?.find(
                  (a: { id: string }) => a.id === answer.selected_answer_id
                );
                const correctAnswer = question.quiz_answers?.find(
                  (a: { is_correct: boolean }) => a.is_correct
                );

                return (
                  <div
                    key={answer.id}
                    className={`p-4 rounded-xl border-2 ${
                      answer.is_correct
                        ? 'border-brand-green-200 bg-brand-green-50'
                        : 'border-brand-red-200 bg-brand-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        answer.is_correct ? 'bg-brand-green-500' : 'bg-brand-red-500'
                      } text-white font-bold text-sm`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{question.question_text}</p>
                        <p className="text-sm text-slate-500 mt-1">
                          {answer.points_earned || 0} / {question.points || 1} points
                        </p>
                      </div>
                      {answer.is_correct ? (
                        <span className="text-slate-400 flex-shrink-0">•</span>
                      ) : (
                        <XCircle className="w-6 h-6 text-brand-red-500 flex-shrink-0" />
                      )}
                    </div>

                    <div className="ml-11 space-y-2">
                      <div className={`p-3 rounded-lg ${
                        answer.is_correct
                          ? 'bg-brand-green-100 border border-brand-green-300'
                          : 'bg-brand-red-100 border border-brand-red-300'
                      }`}>
                        <p className="text-sm font-medium text-slate-700">Your answer:</p>
                        <p className={answer.is_correct ? 'text-brand-green-800' : 'text-brand-red-800'}>
                          {selectedAnswer?.answer_text || 'No answer selected'}
                        </p>
                      </div>

                      {!answer.is_correct && correctAnswer && (
                        <div className="p-3 rounded-lg bg-brand-green-100 border border-brand-green-300">
                          <p className="text-sm font-medium text-slate-700">Correct answer:</p>
                          <p className="text-brand-green-800">{correctAnswer.answer_text}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* If answers not shown */}
        {!quiz.show_correct_answers && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <p className="text-slate-600">
              Detailed answer review is not available for this quiz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
