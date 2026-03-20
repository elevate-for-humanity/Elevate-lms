import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Users, BookOpen } from 'lucide-react';
import { LMS_HEROES } from '@/lib/lms/image-map';

export const metadata: Metadata = {
  title: 'My Courses | LMS',
  description: 'Your enrolled courses and available training programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/lms/courses',
  },
};

export const dynamic = 'force-dynamic';

export default async function MyCoursesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;


  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/courses');

  // Canonical: published courses only
  const { data: courses } = await db
    .from('courses')
    .select('id, title, description, short_description, status, is_active, thumbnail_url, program_id')
    .eq('status', 'published')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Canonical: student enrollments
  const { data: enrollments } = await db
    .from('program_enrollments')
    .select('course_id, status, progress_percent')
    .eq('user_id', user.id)
    .is('revoked_at', null);

  const enrolledCourseIds = new Set(enrollments?.map(e => e.course_id) || []);
  const enrollmentMap = new Map(enrollments?.map(e => [e.course_id, e]) || []);

  const displayCourses = courses || [];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'LMS', href: '/lms/dashboard' }, { label: 'Courses' }]} />
      </div>
      {/* Hero */}
      <section className="relative h-[200px] sm:h-[280px] md:h-[340px]">
        <Image
          src={LMS_HEROES.courses}
          alt="Training classroom"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>

      <section className="bg-slate-900 py-8">
        <div className="max-w-5xl mx-auto px-8">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-brand-blue-300 mb-2">Student Portal</span>
          <h1 className="text-4xl font-black text-white mb-2">My Courses</h1>
          <p className="text-slate-300 text-base">Your enrolled training programs and available courses.</p>
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="max-w-7xl mx-auto">
          {displayCourses.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">No courses yet</h2>
              <p className="text-slate-600 text-sm mb-6">
                Browse available programs and enroll to start learning.
              </p>
              <Link
                href="/lms/programs"
                className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-slate-700 transition"
              >
                Browse Programs
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayCourses.map((course: any) => {
                const isEnrolled = enrolledCourseIds.has(course.id);
                const enrollment = enrollmentMap.get(course.id);
                const progress = enrollment?.progress_percent ?? 0;

                return (
                  <div
                    key={course.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition flex flex-col"
                  >
                    <div className="relative h-44 bg-slate-100 flex-shrink-0">
                      {course.thumbnail_url ? (
                        <Image
                          src={course.thumbnail_url}
                          alt={course.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-slate-300" />
                        </div>
                      )}
                      {isEnrolled && (
                        <span className="absolute top-3 right-3 bg-brand-green-600 text-white px-2 py-0.5 rounded text-xs font-semibold">
                          Enrolled
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-slate-900 mb-1 text-base">{course.title}</h3>
                      {(course.short_description || course.description) && (
                        <p className="text-slate-600 text-sm mb-4 flex-1 line-clamp-2">
                          {course.short_description || course.description}
                        </p>
                      )}

                      {isEnrolled && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-brand-blue-500 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {enrollment?.status === 'pending_approval' ? (
                        <div className="block w-full bg-amber-50 text-amber-800 border border-amber-200 text-center py-2.5 rounded-lg text-sm font-medium">
                          Pending Approval
                        </div>
                      ) : isEnrolled ? (
                        <Link
                          href={`/lms/courses/${course.id}`}
                          className="block w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center py-2.5 rounded-lg text-sm font-semibold transition"
                        >
                          {progress > 0 ? 'Continue Learning' : 'Start Course'}
                        </Link>
                      ) : (
                        <Link
                          href={`/lms/courses/${course.id}`}
                          className="block w-full bg-slate-900 hover:bg-slate-700 text-white text-center py-2.5 rounded-lg text-sm font-semibold transition"
                        >
                          View Course
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
