export const dynamic = 'force-dynamic';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { AchievementsBadges } from '@/components/AchievementsBadges';
import MicroCredentialsBadges from '@/components/MicroCredentialsBadges';
import {
  Trophy,
  Star,
  Award,
  Target,
  BookOpen,
  Flame,
  Zap,
  Medal,
  Crown,
  TrendingUp,
  Calendar,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/lms/achievements',
  },
  title: 'My Achievements | Student Portal',
  description: 'View your learning achievements, milestones, and progress.',
};

export default async function AchievementsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Achievements" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch enrollments
  const { data: enrollments } = await db
    .from('program_enrollments')
    .select(`
      *,
      courses (
        id,
        title,
        description,
        thumbnail_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch completed courses
  const { count: completedCourses } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'completed');

  // Fetch lesson progress
  const { count: completedLessons } = await db
    .from('student_progress')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', user.id)
    .eq('completed', true);

  // Fetch quiz attempts
  const { data: quizAttempts } = await db
    .from('quiz_attempts')
    .select('score, status')
    .eq('user_id', user.id)
    .eq('status', 'completed');

  // Fetch certificates
  const { count: certificatesEarned } = await db
    .from('certificates')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Fetch badges
  const { data: userBadges } = await db
    .from('user_badges')
    .select('*, badges (*)')
    .eq('user_id', user.id);

  // Calculate stats
  const stats = {
    coursesCompleted: completedCourses || 0,
    lessonsCompleted: completedLessons || 0,
    quizzesCompleted: quizAttempts?.length || 0,
    perfectQuizzes: quizAttempts?.filter(q => q.score === 100).length || 0,
    certificatesEarned: certificatesEarned || 0,
    badgesEarned: userBadges?.length || 0,
    totalPoints: 0,
  };

  // Calculate total points
  stats.totalPoints = 
    (stats.coursesCompleted * 100) + 
    (stats.lessonsCompleted * 10) + 
    (stats.quizzesCompleted * 25) + 
    (stats.perfectQuizzes * 50) + 
    (stats.certificatesEarned * 200) +
    (stats.badgesEarned * 25);

  // Define milestones
  const milestones = [
    {
      id: 'first-lesson',
      title: 'First Lesson',
      description: 'Complete your first lesson',
      icon: BookOpen,
      color: 'blue',
      target: 1,
      current: stats.lessonsCompleted,
      points: 10,
    },
    {
      id: 'lesson-streak',
      title: 'Lesson Streak',
      description: 'Complete 10 lessons',
      icon: Flame,
      color: 'orange',
      target: 10,
      current: stats.lessonsCompleted,
      points: 100,
    },
    {
      id: 'first-course',
      title: 'Course Graduate',
      description: 'Complete your first course',
      icon: Trophy,
      color: 'yellow',
      target: 1,
      current: stats.coursesCompleted,
      points: 100,
    },
    {
      id: 'course-master',
      title: 'Course Master',
      description: 'Complete 5 courses',
      icon: Crown,
      color: 'blue',
      target: 5,
      current: stats.coursesCompleted,
      points: 500,
    },
    {
      id: 'quiz-taker',
      title: 'Quiz Taker',
      description: 'Complete 5 quizzes',
      icon: Target,
      color: 'green',
      target: 5,
      current: stats.quizzesCompleted,
      points: 125,
    },
    {
      id: 'perfectionist',
      title: 'Perfectionist',
      description: 'Score 100% on 3 quizzes',
      icon: Star,
      color: 'amber',
      target: 3,
      current: stats.perfectQuizzes,
      points: 150,
    },
    {
      id: 'certified',
      title: 'Certified',
      description: 'Earn your first certificate',
      icon: Award,
      color: 'indigo',
      target: 1,
      current: stats.certificatesEarned,
      points: 200,
    },
    {
      id: 'badge-collector',
      title: 'Badge Collector',
      description: 'Earn 5 badges',
      icon: Medal,
      color: 'pink',
      target: 5,
      current: stats.badgesEarned,
      points: 125,
    },
  ];

  const completedMilestones = milestones.filter(m => m.current >= m.target);
  const inProgressMilestones = milestones.filter(m => m.current < m.target && m.current > 0);
  const lockedMilestones = milestones.filter(m => m.current === 0);

  const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-brand-blue-100', text: 'text-brand-blue-600' },
    orange: { bg: 'bg-brand-orange-100', text: 'text-brand-orange-600' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    blue: { bg: 'bg-brand-blue-100', text: 'text-brand-blue-600' },
    green: { bg: 'bg-brand-green-100', text: 'text-brand-green-600' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
  };

  return (
    <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Achievements" }]} />
        </div>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">My Achievements</h1>
          <p className="text-slate-600 mt-2">
            Track your learning milestones and celebrate your progress
          </p>
        </div>

        {/* Stats Overview */}
        <div className="bg-brand-blue-600 rounded-2xl p-6 text-white mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-black">{stats.totalPoints.toLocaleString()}</div>
              <div className="text-brand-blue-100 text-sm">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black">{stats.coursesCompleted}</div>
              <div className="text-brand-blue-100 text-sm">Courses Completed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black">{stats.lessonsCompleted}</div>
              <div className="text-brand-blue-100 text-sm">Lessons Completed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black">{completedMilestones.length}</div>
              <div className="text-brand-blue-100 text-sm">Milestones Achieved</div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-brand-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.quizzesCompleted}</div>
                <div className="text-xs text-slate-600">Quizzes Passed</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.perfectQuizzes}</div>
                <div className="text-xs text-slate-600">Perfect Scores</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.certificatesEarned}</div>
                <div className="text-xs text-slate-600">Certificates</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <Medal className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.badgesEarned}</div>
                <div className="text-xs text-slate-600">Badges</div>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Milestones */}
        {completedMilestones.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-slate-400 flex-shrink-0">•</span>
              Completed Milestones
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {completedMilestones.map(milestone => {
                const IconComponent = milestone.icon;
                const colors = colorMap[milestone.color];
                return (
                  <div
                    key={milestone.id}
                    className="bg-white rounded-xl border-2 border-brand-green-200 p-6 text-center"
                  >
                    <div className={`w-14 h-14 ${colors.bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                      <IconComponent className={`w-7 h-7 ${colors.text}`} />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{milestone.title}</h3>
                    <p className="text-sm text-slate-600 mb-2">{milestone.description}</p>
                    <div className="flex items-center justify-center gap-1 text-brand-green-600 font-semibold">
                      <Star className="w-4 h-4" />
                      +{milestone.points} pts
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* In Progress Milestones */}
        {inProgressMilestones.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-blue-600" />
              In Progress
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {inProgressMilestones.map(milestone => {
                const IconComponent = milestone.icon;
                const colors = colorMap[milestone.color];
                const progress = Math.round((milestone.current / milestone.target) * 100);
                return (
                  <div
                    key={milestone.id}
                    className="bg-white rounded-xl border border-slate-200 p-6 text-center"
                  >
                    <div className={`w-14 h-14 ${colors.bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                      <IconComponent className={`w-7 h-7 ${colors.text}`} />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{milestone.title}</h3>
                    <p className="text-sm text-slate-600 mb-3">{milestone.description}</p>
                    <div className="mb-2">
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors.bg.replace('100', '500')} rounded-full`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      {milestone.current} / {milestone.target} ({progress}%)
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Locked Milestones */}
        {lockedMilestones.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              Upcoming Milestones
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {lockedMilestones.map(milestone => {
                const IconComponent = milestone.icon;
                return (
                  <div
                    key={milestone.id}
                    className="bg-white rounded-xl border border-slate-200 p-6 text-center opacity-60"
                  >
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
                      <IconComponent className="w-7 h-7 text-slate-400" />
                    </div>
                    <h3 className="font-bold text-slate-700 mb-1">{milestone.title}</h3>
                    <p className="text-sm text-slate-500 mb-2">{milestone.description}</p>
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-sm">
                      <Star className="w-4 h-4" />
                      {milestone.points} pts
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {milestones.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Start Your Journey</h2>
            <p className="text-slate-600 mb-6">
              Begin learning to unlock achievements and earn points!
            </p>
            <Link
              href="/lms/courses"
              className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-blue-700 transition"
            >
              <BookOpen className="w-5 h-5" />
              Browse Courses
            </Link>
          </div>
        )}

        {/* Achievements Badges */}
        <div className="mt-12">
          <AchievementsBadges userId={user.id} />
        </div>

        {/* Micro-Credentials */}
        <div className="mt-12">
          <MicroCredentialsBadges />
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/lms/dashboard" className="text-brand-blue-600 hover:text-brand-blue-700 font-medium">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
