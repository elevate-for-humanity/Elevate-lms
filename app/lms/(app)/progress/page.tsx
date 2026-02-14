import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ProgressDashboard } from '@/components/ProgressDashboard';
import { ProgressTrackingDashboard } from '@/components/ProgressTrackingDashboard';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  BookOpen,
  Award,
  Target,
  Calendar,
  ChevronRight,
  Play
} from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/lms/progress',
  },
  title: 'My Progress | Student Portal',
  description: 'Track your learning progress, completed lessons, and achievements.',
};

export const dynamic = 'force-dynamic';

export default async function ProgressPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Progress" }]} />
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

  let enrollments: any[] = [];
  let recentActivity: any[] = [];
  const stats = {
    totalCourses: 0,
    completedCourses: 0,
    totalLessons: 0,
    completedLessons: 0,
    totalHours: 0,
    streak: 0
  };

  try {
    // Get enrollments with course details
    const { data: enrollmentData } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (
          id,
          title,
          description,
          thumbnail_url,
          total_lessons,
          duration_hours
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (enrollmentData) {
      enrollments = enrollmentData;
      stats.totalCourses = enrollments.length;
      stats.completedCourses = enrollments.filter(e => e.status === 'completed').length;
      
      enrollments.forEach(e => {
        stats.totalLessons += e.courses?.total_lessons || 0;
        stats.completedLessons += e.completed_lessons || 0;
        stats.totalHours += e.courses?.duration_hours || 0;
      });
    }

    // Get recent progress activity
    const { data: progressData } = await supabase
      .from('student_progress')
      .select(`
        *,
        courses (title),
        lessons (title)
      `)
      .eq('student_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (progressData) {
      recentActivity = progressData;
    }

    // Calculate streak (days of consecutive activity)
    const { data: activityDates } = await supabase
      .from('student_progress')
      .select('updated_at')
      .eq('student_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(30);

    if (activityDates && activityDates.length > 0) {
      let streak = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastActivity = new Date(activityDates[0].updated_at);
      lastActivity.setHours(0, 0, 0, 0);
      
      // Check if last activity was today or yesterday
      const diffDays = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        for (let i = 1; i < activityDates.length; i++) {
          const current = new Date(activityDates[i].updated_at);
          const prev = new Date(activityDates[i - 1].updated_at);
          current.setHours(0, 0, 0, 0);
          prev.setHours(0, 0, 0, 0);
          
          const dayDiff = Math.floor((prev.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
          if (dayDiff === 1) {
            streak++;
          } else if (dayDiff > 1) {
            break;
          }
        }
        stats.streak = streak;
      }
    }
  } catch (error) {
    console.log('Error fetching progress data');
  }

  // Calculate overall progress percentage
  const overallProgress = stats.totalLessons > 0 
    ? Math.round((stats.completedLessons / stats.totalLessons) * 100) 
    : 0;

  // Format relative time
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Progress" }]} />
        </div>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Progress</h1>
          <p className="text-slate-600 mt-1">
            Track your learning journey and achievements
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.totalCourses}</div>
                <div className="text-xs text-slate-600">Courses</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.completedCourses}</div>
                <div className="text-xs text-slate-600">Completed</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.completedLessons}</div>
                <div className="text-xs text-slate-600">Lessons Done</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.totalHours}</div>
                <div className="text-xs text-slate-600">Hours</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{overallProgress}%</div>
                <div className="text-xs text-slate-600">Overall</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.streak}</div>
                <div className="text-xs text-slate-600">Day Streak</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course Progress */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Course Progress</h2>
              </div>

              {enrollments.length > 0 ? (
                <div className="divide-y divide-slate-200">
                  {enrollments.map((enrollment) => {
                    const progress = enrollment.courses?.total_lessons > 0
                      ? Math.round((enrollment.completed_lessons || 0) / enrollment.courses.total_lessons * 100)
                      : 0;
                    
                    return (
                      <Link
                        key={enrollment.id}
                        href={`/lms/courses/${enrollment.course_id}`}
                        className="block p-6 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                            {enrollment.courses?.thumbnail_url ? (
                              <Image 
                                src={enrollment.courses.thumbnail_url} 
                                alt={enrollment.courses.title || 'Course thumbnail'} 
                                fill
                                className="object-cover rounded-xl"
                                sizes="64px"
                              />
                            ) : (
                              <BookOpen className="w-8 h-8 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-bold text-slate-900 truncate">
                                {enrollment.courses?.title || 'Course'}
                              </h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                enrollment.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {enrollment.status === 'completed' ? 'Completed' : 'In Progress'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mb-3">
                              {enrollment.completed_lessons || 0} of {enrollment.courses?.total_lessons || 0} lessons completed
                            </p>
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-sm font-medium text-slate-700 w-12 text-right">
                                {progress}%
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="p-16 text-center">
                  <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Courses Yet</h3>
                  <p className="text-slate-600 mb-6">
                    Enroll in courses to start tracking your progress.
                  </p>
                  <Link
                    href="/lms/courses"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
                  >
                    Browse Courses
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Recent Activity</h3>
              
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Play className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 truncate">
                          {activity.lessons?.title || 'Lesson'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {activity.courses?.title} • {formatTimeAgo(activity.updated_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600 text-center py-4">
                  No recent activity
                </p>
              )}
            </div>

            {/* Learning Streak */}
            <div className="bg-orange-500 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-4xl font-black">{stats.streak}</div>
                  <div className="text-orange-100">Day Streak</div>
                </div>
              </div>
              <p className="text-sm text-orange-100">
                {stats.streak > 0 
                  ? "Keep it up! You're on a roll!" 
                  : "Start learning today to build your streak!"}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link 
                  href="/lms/courses"
                  className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Continue Learning
                </Link>
                <Link 
                  href="/lms/certificates"
                  className="block w-full text-center border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition"
                >
                  View Certificates
                </Link>
              </div>
            </div>
          </div>

          {/* Progress Dashboard */}
          <div className="mt-8">
            <ProgressDashboard userId={user.id} />
          </div>

          {/* Progress Tracking */}
          <div className="mt-8">
            <ProgressTrackingDashboard />
          </div>
        </div>
      </div>
    </div>
  );
}
