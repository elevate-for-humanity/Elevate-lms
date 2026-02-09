import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { BookOpen, Clock, CheckCircle, Award, TrendingUp } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'My Progress | Student Portal',
  description: 'Track your course progress and achievements.',
};

export const dynamic = 'force-dynamic';

export default async function StudentProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login?next=/student/progress');

  // Fetch enrollments with course data
  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      progress,
      status,
      enrolled_at,
      completed_at,
      programs (
        id,
        name,
        description,
        duration_weeks
      )
    `)
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false });

  if (error) {
    console.error('Error fetching progress:', error.message);
  }

  const courses = (enrollments || []).map((e: any) => ({
    id: e.id,
    name: e.programs?.name || 'Course',
    description: e.programs?.description || '',
    progress: e.progress || 0,
    status: e.status || 'active',
    enrolledAt: e.enrolled_at,
    completedAt: e.completed_at,
    durationWeeks: e.programs?.duration_weeks || 0,
  }));

  const completedCount = courses.filter(c => c.status === 'completed').length;
  const inProgressCount = courses.filter(c => c.status === 'active').length;
  const totalProgress = courses.length > 0 
    ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Student', href: '/student' }, { label: 'Progress' }]} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Progress</h1>
          <p className="text-gray-600 mt-1">Track your learning journey</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                <p className="text-sm text-gray-500">Total Courses</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{inProgressCount}</p>
                <p className="text-sm text-gray-500">In Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalProgress}%</p>
                <p className="text-sm text-gray-500">Avg Progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* Courses */}
        {courses.length > 0 ? (
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{course.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    course.status === 'completed' 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {course.status === 'completed' ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-500">
                    Enrolled {new Date(course.enrolledAt).toLocaleDateString()}
                  </span>
                  <Link 
                    href={`/lms/courses/${course.id}`}
                    className="text-blue-600 hover:underline text-sm font-medium"
                  >
                    Continue Learning →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h2>
            <p className="text-gray-600 mb-6">Start your learning journey by enrolling in a course.</p>
            <Link 
              href="/programs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Programs
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
