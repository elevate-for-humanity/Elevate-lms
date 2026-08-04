import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Clock, Play, CheckCircle, Video, Scissors, ArrowRight, Award } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `My Courses | ${PLATFORM_DEFAULTS.orgName} LMS`,
  description: 'Access your enrolled courses and track your learning progress.',
};

export const dynamic = 'force-dynamic';

export default async function LMSCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign in to view your courses</h2>
          <p className="text-slate-500 mb-6">Access your enrolled courses and track your progress.</p>
          <Link href="/login?redirect=/lms/courses" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Fetch enrolled courses for this user
  const { data: enrolledCourses } = await supabase
    .from('lms_progress')
    .select(`
      id,
      status,
      progress_percent,
      started_at,
      last_activity_at,
      course:course_id (
        id,
        title,
        slug,
        short_description,
        thumbnail_url,
        total_lessons,
        duration_hours
      )
    `)
    .eq('user_id', user.id)
    .eq('course.is_active', true);

  // Also fetch the barber apprenticeship course if user is an apprentice
  const { data: barberCourse } = await supabase
    .from('courses')
    .select('id, title, slug, short_description, thumbnail_url, total_lessons, duration_hours')
    .eq('slug', 'barber-apprenticeship')
    .eq('is_active', true)
    .single();

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-white border-b border-slate-200 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-slate-500 mt-1">Track your enrolled courses and progress.</p>
        </div>
      </section>
      
      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto">
          {enrolledCourses && enrolledCourses.length > 0 ? (
            <div className="space-y-4">
              {enrolledCourses.map((ec) => (
                <div key={ec.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      {ec.course?.thumbnail_url ? (
                        <img src={ec.course.thumbnail_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
                      ) : (
                        <Scissors className="w-8 h-8 text-cyan-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 truncate">{ec.course?.title || 'Course'}</h3>
                      <p className="text-sm text-slate-500 truncate">{ec.course?.short_description || ''}</p>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900">{ec.progress_percent || 0}%</div>
                        <div className="text-sm text-slate-500">Complete</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-slate-700">{ec.course?.total_lessons || 0} lessons</div>
                        <div className="text-sm text-slate-500">{ec.course?.duration_hours || 0}h</div>
                      </div>
                      <Link 
                        href={`/lms/courses/${ec.course?.slug}`}
                        className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-cyan-700 transition flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" /> Continue
                      </Link>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-500 rounded-full transition-all"
                        style={{ width: `${ec.progress_percent || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : barberCourse ? (
            /* Show barber apprenticeship as primary course */
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition">
                <div className="bg-gradient-to-r from-cyan-600 to-blue-700 p-8">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Scissors className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="w-4 h-4 text-cyan-200" />
                        <span className="text-cyan-200 text-sm font-medium">DOL Registered Apprenticeship</span>
                      </div>
                      <h2 className="text-2xl font-bold text-white">{barberCourse.title}</h2>
                      <p className="text-cyan-100 text-sm mt-1">Indiana Barber License Preparation Course</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-8 mb-6">
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-cyan-600" />
                      <span className="text-sm font-medium text-slate-700">{barberCourse.total_lessons} Video Lessons</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-cyan-600" />
                      <span className="text-sm font-medium text-slate-700">{barberCourse.duration_hours}h Training</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">State Board Prep</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link 
                      href="/apprentice/course"
                      className="bg-cyan-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-cyan-700 transition flex items-center gap-2 shadow-lg shadow-cyan-600/30"
                    >
                      <Play className="w-5 h-5" /> Start Video Training
                    </Link>
                    <Link 
                      href="/apprentice"
                      className="bg-slate-100 text-slate-700 px-8 py-4 rounded-xl font-medium hover:bg-slate-200 transition flex items-center gap-2"
                    >
                      View Dashboard <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">No Courses Yet</h2>
              <p className="text-slate-500 mb-6">Browse available programs to start your learning journey.</p>
              <Link href="/programs" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
                Browse Programs
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
