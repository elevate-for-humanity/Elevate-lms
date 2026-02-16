export const dynamic = 'force-dynamic';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LearningAnalyticsDashboard from '@/components/LearningAnalyticsDashboard';
import StudentEngagementAnalytics from '@/components/StudentEngagementAnalytics';
import {
  BarChart3,
  TrendingUp,
  Clock,
  BookOpen,
  Target,
  Award,
  Calendar,
  Activity,
  Zap,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/lms/analytics',
  },
  title: 'Learning Analytics | Student Portal',
  description: 'Track your learning progress, time spent, and performance metrics.',
};

export default async function AnalyticsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Analytics" }]} />
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

  // Fetch enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      courses (
        id,
        title,
        total_lessons,
        duration_hours
      )
    `)
    .eq('user_id', user.id);

  // Fetch lesson progress
  const { data: lessonProgress } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', user.id)
    .order('updated_at', { ascending: false });

  // Fetch quiz attempts
  const { data: quizAttempts } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false });

  // Fetch assignment submissions
  const { data: assignments } = await supabase
    .from('assignment_submissions')
    .select('*')
    .eq('student_id', user.id)
    .order('submitted_at', { ascending: false });

  // Calculate stats
  const stats = {
    totalCourses: enrollments?.length || 0,
    completedCourses: enrollments?.filter(e => e.status === 'completed').length || 0,
    activeCourses: enrollments?.filter(e => e.status === 'active').length || 0,
    totalLessons: enrollments?.reduce((sum, e) => sum + (e.courses?.total_lessons || 0), 0) || 0,
    completedLessons: lessonProgress?.filter(p => p.completed).length || 0,
    totalQuizzes: quizAttempts?.length || 0,
    avgQuizScore: 0,
    totalAssignments: assignments?.length || 0,
    gradedAssignments: assignments?.filter(a => a.grade !== null).length || 0,
    totalHours: enrollments?.reduce((sum, e) => sum + (e.courses?.duration_hours || 0), 0) || 0,
  };

  if (quizAttempts && quizAttempts.length > 0) {
    stats.avgQuizScore = Math.round(
      quizAttempts.reduce((sum, q) => sum + (q.score || 0), 0) / quizAttempts.length
    );
  }

  // Calculate weekly activity (last 7 days)
  const weeklyActivity = Array(7).fill(0);
  const today = new Date();
  lessonProgress?.forEach(progress => {
    const progressDate = new Date(progress.updated_at);
    const daysDiff = Math.floor((today.getTime() - progressDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff >= 0 && daysDiff < 7) {
      weeklyActivity[6 - daysDiff]++;
    }
  });

  // Calculate course progress
  const courseProgress = enrollments?.map(enrollment => {
    const totalLessons = enrollment.courses?.total_lessons || 0;
    const completedLessons = enrollment.completed_lessons || 0;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return {
      id: enrollment.course_id,
      title: enrollment.courses?.title || 'Course',
      progress,
      completedLessons,
      totalLessons,
      status: enrollment.status,
    };
  }) || [];

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxActivity = Math.max(...weeklyActivity, 1);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Analytics" }]} />
        </div>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Learning Analytics</h1>
          <p className="text-slate-600 mt-1">
            Track your progress and performance across all courses
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.totalCourses}</div>
                <div className="text-xs text-slate-600">Total Courses</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-slate-400 flex-shrink-0">•</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.completedLessons}</div>
                <div className="text-xs text-slate-600">Lessons Done</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.avgQuizScore}%</div>
                <div className="text-xs text-slate-600">Avg Quiz Score</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.totalHours}h</div>
                <div className="text-xs text-slate-600">Course Hours</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weekly Activity */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-blue-600" />
                Weekly Activity
              </h2>
              <div className="flex items-end justify-between h-32 gap-2">
                {weeklyActivity.map((count, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-brand-blue-500 rounded-t-lg transition-all"
                      style={{
                        height: `${(count / maxActivity) * 100}%`,
                        minHeight: count > 0 ? '8px' : '4px',
                        backgroundColor: count > 0 ? undefined : '#e2e8f0',
                      }}
                    />
                    <span className="text-xs text-slate-500">{dayNames[index]}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-600 mt-4 text-center">
                {lessonProgress?.filter(p => {
                  const date = new Date(p.updated_at);
                  const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                  return daysDiff < 7;
                }).length || 0} lessons completed this week
              </p>
            </div>

            {/* Course Progress */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Course Progress
              </h2>
              {courseProgress.length > 0 ? (
                <div className="space-y-4">
                  {courseProgress.map((course) => (
                    <div key={course.id} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-slate-900">{course.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          course.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-brand-blue-100 text-brand-blue-700'
                        }`}>
                          {course.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                course.progress === 100 ? 'bg-green-500' : 'bg-brand-blue-500'
                              }`}
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-slate-700 w-16 text-right">
                          {course.progress}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {course.completedLessons} of {course.totalLessons} lessons
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-center py-8">
                  Enroll in courses to track your progress
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand-blue-600" />
                Performance
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Quizzes Taken</span>
                  <span className="font-bold text-slate-900">{stats.totalQuizzes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Avg Score</span>
                  <span className="font-bold text-slate-900">{stats.avgQuizScore}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Assignments</span>
                  <span className="font-bold text-slate-900">{stats.totalAssignments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Graded</span>
                  <span className="font-bold text-slate-900">{stats.gradedAssignments}</span>
                </div>
              </div>
            </div>

            {/* Completion Stats */}
            <div className="bg-brand-blue-600 rounded-2xl p-6 text-white">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Completion Stats
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-brand-blue-100">Courses</span>
                    <span className="font-bold">{stats.completedCourses}/{stats.totalCourses}</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full"
                      style={{
                        width: `${stats.totalCourses > 0 ? (stats.completedCourses / stats.totalCourses) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-brand-blue-100">Lessons</span>
                    <span className="font-bold">{stats.completedLessons}/{stats.totalLessons}</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full"
                      style={{
                        width: `${stats.totalLessons > 0 ? (stats.completedLessons / stats.totalLessons) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/lms/progress"
                  className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                >
                  <TrendingUp className="w-4 h-4 text-brand-blue-600" />
                  <span className="text-slate-700">View Progress</span>
                </Link>
                <Link
                  href="/lms/grades"
                  className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                >
                  <Award className="w-4 h-4 text-green-600" />
                  <span className="text-slate-700">View Grades</span>
                </Link>
                <Link
                  href="/lms/achievements"
                  className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                >
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span className="text-slate-700">Achievements</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Learning Analytics */}
          <div className="mt-8">
            <LearningAnalyticsDashboard />
          </div>

          {/* Student Engagement */}
          <div className="mt-8">
            <StudentEngagementAnalytics />
          </div>
        </div>
      </div>
    </div>
  );
}
