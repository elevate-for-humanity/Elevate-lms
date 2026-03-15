import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LmsHeroBanner } from '@/components/lms/LmsHeroBanner';
import { FileQuestion, Clock, Circle, AlertCircle, Play, Trophy, ChevronRight, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Quizzes | Student Portal',
  description: 'View available quizzes, track your scores, and review past attempts.',
};

export const dynamic = 'force-dynamic';

export default async function QuizzesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Quizzes" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let quizzes: any[] = [];
  let attempts: any[] = [];
  const stats = { available: 0, completed: 0, passed: 0, avgScore: 0 };

  try {
    const { data: enrollments } = await db
      .from('program_enrollments')
      .select('course_id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const courseIds = enrollments?.map(e => e.course_id) || [];

    if (courseIds.length > 0) {
      const { data: quizData } = await db
        .from('quizzes')
        .select('*, courses (id, title)')
        .in('course_id', courseIds)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (quizData) {
        quizzes = quizData;
      }

      const { data: attemptData } = await db
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (attemptData) {
        attempts = attemptData;
      }
    }

    stats.available = quizzes.length;
    const completedQuizIds = new Set(attempts.filter(a => a.completed_at).map(a => a.quiz_id));
    stats.completed = completedQuizIds.size;
    
    const passedAttempts = attempts.filter(a => a.score >= (quizzes.find(q => q.id === a.quiz_id)?.passing_score || 70));
    stats.passed = new Set(passedAttempts.map(a => a.quiz_id)).size;
    
    if (attempts.length > 0) {
      stats.avgScore = Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length);
    }
  } catch (error) {
    // Quiz data fetch failed — tables may not exist yet
  }

  const getQuizStatus = (quiz: any) => {
    const quizAttempts = attempts.filter(a => a.quiz_id === quiz.id);
    const bestAttempt = quizAttempts.reduce((best, a) => (!best || a.score > best.score) ? a : best, null);
    
    if (!bestAttempt) {
      return { status: 'not_started', label: 'Not Started', color: 'bg-white text-slate-700' };
    }
    
    if (bestAttempt.score >= (quiz.passing_score || 70)) {
      return { status: 'passed', label: 'Passed', color: 'bg-brand-green-100 text-brand-green-700' };
    }
    
    return { status: 'attempted', label: 'Attempted', color: 'bg-yellow-100 text-yellow-700' };
  };

  const getBestScore = (quizId: string) => {
    const quizAttempts = attempts.filter(a => a.quiz_id === quizId);
    if (quizAttempts.length === 0) return null;
    return Math.max(...quizAttempts.map(a => a.score || 0));
  };

  return (
    <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Quizzes" }]} />
        </div>
      <div className="max-w-7xl mx-auto px-4">
        <LmsHeroBanner
          title="Quizzes & Assessments"
          subtitle={`${stats.available} quizzes available. ${stats.completed} completed with ${stats.avgScore}% average score.`}
          image="/images/pages/training-classroom.jpg"
          eyebrow="Test Your Knowledge"
          cta={stats.available > stats.completed ? { label: 'Start Next Quiz', href: '#available-quizzes' } : undefined}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <FileQuestion className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.available}</div>
                <div className="text-sm text-slate-600">Available</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Circle className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.completed}</div>
                <div className="text-sm text-slate-600">Completed</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-brand-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.passed}</div>
                <div className="text-sm text-slate-600">Passed</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-brand-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.avgScore}%</div>
                <div className="text-sm text-slate-600">Avg Score</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">All Quizzes</h2>
          </div>

          {quizzes.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {quizzes.map((quiz) => {
                const statusInfo = getQuizStatus(quiz);
                const bestScore = getBestScore(quiz.id);
                const attemptCount = attempts.filter(a => a.quiz_id === quiz.id).length;

                return (
                  <Link key={quiz.id} href={`/lms/quizzes/${quiz.id}`} className="block p-6 hover:bg-white transition">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileQuestion className="w-6 h-6 text-brand-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-slate-900 truncate">{quiz.title}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{quiz.courses?.title}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <FileQuestion className="w-4 h-4" />
                              <span>{quiz.question_count || 10} questions</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{quiz.time_limit || 30} minutes</span>
                            </div>
                            <div>Passing: {quiz.passing_score || 70}%</div>
                            {attemptCount > 0 && <div>{attemptCount} attempt{attemptCount > 1 ? 's' : ''}</div>}
                          </div>
                          {bestScore !== null && (
                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-brand-blue-50 rounded-lg">
                              <span className="text-sm text-brand-blue-700">Best Score: <strong>{bestScore}%</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        {statusInfo.status === 'not_started' ? (
                          <span className="flex items-center gap-1 text-brand-blue-600 font-medium">
                            <Play className="w-4 h-4" /> Start
                          </span>
                        ) : (
                          <span className="text-slate-600 font-medium">Review</span>
                        )}
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Quizzes Available</h3>
              <p className="text-slate-600 mb-6">Quizzes from your enrolled courses will appear here.</p>
              <Link href="/learner/courses" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-blue-700 transition">
                Browse Courses
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
