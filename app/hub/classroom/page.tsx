import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Play, Clock, ChevronRight, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Classroom | Elevate Hub',
  description: 'Access your courses, track progress, and continue learning.',
};

export const dynamic = 'force-dynamic';

export default async function ClassroomPage() {
  const supabase = await createClient();
  
  if (!supabase) redirect('/login');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/hub/classroom');

  // Fetch user enrollments with course details
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select(`
      *,
      courses (id, title, description, thumbnail_url, duration_hours),
      programs (id, name, slug)
    `)
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false });

  // Fetch available courses
  const { data: availableCourses } = await supabase
    .from('training_courses')
    .select('*')
    .eq('is_active', true)
    .limit(6);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Classroom</h1>
            <p className="text-slate-600 mt-1">Continue your learning journey</p>
          </div>
          <Link 
            href="/programs" 
            className="px-4 py-2 bg-brand-green-600 text-white rounded-lg font-medium hover:bg-brand-green-700"
          >
            Browse Programs
          </Link>
        </div>

        {/* My Courses */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">My Courses</h2>
          {enrollments && enrollments.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment: any) => (
                <div key={enrollment.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition">
                  <div className="h-40 bg-white flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-slate-400" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-slate-900 mb-2">
                      {enrollment.courses?.title || enrollment.programs?.name || 'Course'}
                    </h3>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {enrollment.courses?.description || 'Continue your training'}
                    </p>
                    
                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-medium">{enrollment.progress || 0}%</span>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full"
                          style={{ width: `${enrollment.progress || 0}%` }}
                        />
                      </div>
                    </div>

                    <Link
                      href={`/lms/courses/${enrollment.course_id || enrollment.courses?.id}`}
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800"
                    >
                      <Play className="w-4 h-4" />
                      {enrollment.progress > 0 ? 'Continue' : 'Start'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No courses yet</h3>
              <p className="text-slate-600 mb-6">Start your learning journey by enrolling in a program</p>
              <Link 
                href="/programs" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green-600 text-white rounded-lg font-medium hover:bg-brand-green-700"
              >
                Browse Programs
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

        {/* Recommended Courses */}
        {availableCourses && availableCourses.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Recommended For You</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.slice(0, 3).map((course: any) => (
                <div key={course.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition">
                  <div className="h-32 bg-white flex items-center justify-center">
                    <Award className="w-12 h-12 text-slate-400" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-slate-900 mb-2">{course.title}</h3>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.duration_hours || 10}h
                      </span>
                      <Link
                        href={`/courses/${course.id}`}
                        className="text-brand-green-600 font-medium hover:text-brand-green-700"
                      >
                        Learn More
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
