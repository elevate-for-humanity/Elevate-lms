import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const { courseId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  if (!supabase) {
    return {
      title: 'Course | Elevate for Humanity',
      description: 'Workforce training course at Elevate for Humanity.',
    };
  }
  
  const { data: course } = await db
    .from('training_courses')
    .select('title, description')
    .eq('id', courseId)
    .single();

  if (!course) {
    return {
      title: 'Course Not Found | Elevate for Humanity',
      description: 'The requested course could not be found.',
    };
  }

  return {
    title: `${course.title} | Elevate for Humanity`,
    description: course.description || `Learn ${course.title} with Elevate for Humanity workforce training programs.`,
    alternates: {
      canonical: `https://www.elevateforhumanity.org/courses/${courseId}`,
    },
  };
}
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Users, Award, BookOpen, Play } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  // Fetch course details
  const { data: course, error } = await db
    .from('training_courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error || !course) {
    notFound();
  }

  // Fetch lessons
  const { data: lessons } = await db
    .from('training_lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index');

  // Check if user is enrolled
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let enrollment: any = null;
  let completedLessonIds: Set<string> = new Set();
  let progressPercent = 0;

  if (user) {
    const { data }: any = await db
      .from('training_enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();
    enrollment = data;

    if (enrollment) {
      // Fetch lesson progress for this user + course
      const { data: progressData } = await db
        .from('lesson_progress')
        .select('lesson_id, completed')
        .eq('user_id', user.id)
        .eq('course_id', courseId);

      if (progressData) {
        for (const p of progressData) {
          if (p.completed) completedLessonIds.add(p.lesson_id);
        }
      }
      const totalLessons = lessons?.length || 1;
      progressPercent = Math.round((completedLessonIds.size / totalLessons) * 100);
    }
  }

  const isEnrolled = !!enrollment;
  const firstLesson = lessons?.[0];
  // Find the first incomplete lesson for "Continue" button
  const nextLesson = isEnrolled
    ? lessons?.find((l: any) => !completedLessonIds.has(l.id)) || firstLesson
    : firstLesson;

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Courses', href: '/courses' },
          { label: course.title },
        ]}
      />

      {/* Hero */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          {isEnrolled && (
            <span className="inline-block bg-brand-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
              Enrolled
            </span>
          )}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{course.title}</h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-6">{course.description}</p>

          {isEnrolled && nextLesson && (
            <Link
              href={`/lms/courses/${courseId}/lessons/${nextLesson.id}`}
              className="inline-flex items-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors"
            >
              <Play className="w-5 h-5" />
              {completedLessonIds.size > 0 ? 'Continue Learning' : 'Start Learning'}
            </Link>
          )}

          {isEnrolled && (
            <div className="max-w-md mx-auto mt-6">
              <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                <span>{completedLessonIds.size} of {lessons?.length || 0} lessons complete</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div
                  className="bg-brand-green-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Course Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-black text-black mb-6">
              What You&apos;ll Learn
            </h2>
            <div className="prose prose-lg max-w-none mb-12">
              <p className="text-black">{course.description}</p>
            </div>

            {/* Lessons */}
            <h2 className="text-3xl font-black text-black mb-6">
              Course Curriculum
              {isEnrolled && (
                <span className="text-base font-normal text-slate-500 ml-3">
                  {completedLessonIds.size}/{lessons?.length || 0} completed
                </span>
              )}
            </h2>
            <div className="space-y-3">
              {lessons && lessons.length > 0 ? (
                lessons.map((lesson: any, index: number) => {
                  const isCompleted = completedLessonIds.has(lesson.id);
                  const lessonContent = (
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-brand-green-100'
                          : 'bg-brand-blue-100'
                      }`}>
                        {isCompleted ? (
                          <span className="text-brand-green-600 font-bold text-sm">✓</span>
                        ) : (
                          <span className="font-bold text-brand-blue-600">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold mb-1 ${isCompleted ? 'text-brand-green-700' : 'text-black'}`}>
                          {lesson.title}
                        </h3>
                        {lesson.description && (
                          <p className="text-slate-600 text-sm">{lesson.description}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <span className="text-xs font-semibold text-brand-green-600 bg-brand-green-50 px-2 py-1 rounded-full">Done</span>
                        ) : (
                          <Play className="w-5 h-5 text-brand-blue-500" />
                        )}
                      </div>
                    </div>
                  );

                  const lessonHref = isEnrolled
                    ? `/lms/courses/${courseId}/lessons/${lesson.id}`
                    : `/courses/${courseId}/lessons/${lesson.id}`;

                  return (
                    <Link
                      key={lesson.id}
                      href={lessonHref}
                      className={`block border-2 rounded-xl p-5 transition-colors ${
                        isCompleted
                          ? 'border-brand-green-200 bg-brand-green-50/30 hover:border-brand-green-300'
                          : 'border-gray-200 bg-white hover:border-brand-blue-400 hover:shadow-sm'
                      }`}
                    >
                      {lessonContent}
                    </Link>
                  );
                })
              ) : (
                <p className="text-black">
                  Course content is being prepared. Check back soon!
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 sticky top-24">
              <h3 className="text-2xl font-black text-black mb-6">
                {isEnrolled ? 'Your Progress' : 'Course Details'}
              </h3>

              {isEnrolled && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-600">{completedLessonIds.size}/{lessons?.length || 0} lessons</span>
                    <span className="font-bold text-brand-blue-600">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-brand-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Award className="h-8 w-8 text-brand-blue-600" />
                  <div>
                    <div className="font-bold text-black">Certificate</div>
                    <div className="text-sm text-slate-600">Upon completion</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-brand-blue-600" />
                  <div>
                    <div className="font-bold text-black">Duration</div>
                    <div className="text-sm text-slate-600">
                      {course.duration || 'Self-paced'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-brand-blue-600" />
                  <div>
                    <div className="font-bold text-black">Lessons</div>
                    <div className="text-sm text-slate-600">
                      {lessons?.length || 0} lessons
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-brand-blue-600" />
                  <div>
                    <div className="font-bold text-black">Access</div>
                    <div className="text-sm text-slate-600">Lifetime access</div>
                  </div>
                </div>
              </div>

              {isEnrolled ? (
                <div className="space-y-3">
                  {nextLesson && (
                    <Link
                      href={`/lms/courses/${courseId}/lessons/${nextLesson.id}`}
                      className="block w-full text-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-6 py-4 rounded-xl font-bold transition-colors"
                    >
                      {completedLessonIds.size > 0 ? 'Continue Learning' : 'Start Course'}
                    </Link>
                  )}
                  <Link
                    href="/lms/dashboard"
                    className="block w-full text-center border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:border-slate-400 transition-colors"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              ) : (
                <Link
                  href={user ? `/courses/${courseId}/enroll` : `/login?next=/courses/${courseId}`}
                  className="block w-full text-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-6 py-4 rounded-xl font-bold transition-colors"
                >
                  {user ? 'Enroll Now' : 'Sign In to Enroll'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
