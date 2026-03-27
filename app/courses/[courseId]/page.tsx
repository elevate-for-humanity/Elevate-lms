import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Known course UUIDs → program slug for courses with dedicated pages.
// These redirect immediately without querying Supabase.
const COURSE_ID_TO_PROGRAM_SLUG: Record<string, string> = {
  '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0': 'hvac-technician',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const { courseId } = await params;

  // Known courses redirect — metadata won't be used, but return something sensible
  if (COURSE_ID_TO_PROGRAM_SLUG[courseId]) {
    return {
      title: 'Redirecting... | Elevate for Humanity',
      description: 'Redirecting to course page.',
    };
  }

  const supabase = await createClient();

  if (!db) {
    return {
      title: 'Course | Elevate for Humanity',
      description: 'Workforce training course at Elevate for Humanity.',
    };
  }

  const { data: course } = await supabase
    .from('training_courses')
    .select('course_name, description')
    .eq('id', courseId)
    .single();

  if (!course) {
    return {
      title: 'Course Not Found | Elevate for Humanity',
      description: 'The requested course could not be found.',
    };
  }

  return {
    title: `${course.course_name} | Elevate for Humanity`,
    description: course.description || `Learn ${course.course_name} with Elevate for Humanity workforce training programs.`,
    alternates: {
      canonical: `https://www.elevateforhumanity.org/courses/${courseId}`,
    },
  };
}
import { Clock, Users, Award, BookOpen, Play, ChevronDown, Shield, Wrench } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { LESSON_MODULE_MAP, getModuleForLesson } from '@/lib/courses/lesson-module-map';

export const dynamic = 'force-dynamic';

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  // Redirect known courses to their dedicated program pages immediately,
  // before any DB call. These courses have full local definitions and
  // don't need Supabase data to render.
  const knownSlug = COURSE_ID_TO_PROGRAM_SLUG[courseId];
  if (knownSlug) {
    redirect(`/programs/${knownSlug}/course`);
  }

  const supabase = await createClient();

  if (!db) {
    notFound();
  }

  const { data: course, error } = await supabase
    .from('training_courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error || !course) {
    notFound();
  }

  // Fetch published lessons
  const { data: lessons } = await supabase
    .from('training_lessons')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_published', true)
    .order('lesson_number');

  // Fetch modules
  const { data: modules } = await supabase
    .from('course_modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index');

  // Check enrollment
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let enrollment: any = null;
  const completedLessonIds: Set<string> = new Set();
  let progressPercent = 0;

  if (user) {
    const { data }: any = await supabase
      .from('training_enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();
    enrollment = data;

    if (enrollment) {
      const { data: progressData } = await supabase
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
  const nextLesson = isEnrolled
    ? lessons?.find((l: any) => !completedLessonIds.has(l.id)) || firstLesson
    : firstLesson;

  // Group lessons by module
  const moduleGroups = (modules || []).map((mod: any) => {
    const moduleLessons = (lessons || []).filter(
      (l: any) => getModuleForLesson(l.lesson_number) === mod.order_index
    );
    const completedCount = moduleLessons.filter((l: any) => completedLessonIds.has(l.id)).length;
    return { ...mod, lessons: moduleLessons, completedCount };
  });

  // Hero image based on course type
  const heroImage = '/images/pages/hvac-technician.jpg';

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: 'Courses', href: '/courses' },
          { label: course.course_name },
        ]}
      />

      {/* Hero Banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt={`${course.course_name} training program`}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-3xl">
            {isEnrolled && (
              <span className="inline-flex items-center gap-1.5 bg-brand-green-500/20 text-brand-green-300 text-xs font-bold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider border border-brand-green-500/30">
                <span className="w-2 h-2 rounded-full bg-brand-green-400 animate-pulse" />
                Enrolled
              </span>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">
              {course.course_name}
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-2xl">
              {course.description}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-5 h-5 text-brand-blue-400" />
                <span className="text-sm font-medium">{course.duration_hours || 375} hours</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <BookOpen className="w-5 h-5 text-brand-blue-400" />
                <span className="text-sm font-medium">{lessons?.length || 0} lessons</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="w-5 h-5 text-brand-blue-400" />
                <span className="text-sm font-medium">15 weeks</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Award className="w-5 h-5 text-brand-blue-400" />
                <span className="text-sm font-medium">EPA 608 + OSHA 30</span>
              </div>
            </div>

            {/* CTA — always allow starting the course */}
            {firstLesson && (
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/courses/${courseId}/lessons/${(isEnrolled && nextLesson ? nextLesson : firstLesson).id}`}
                  className="inline-flex items-center justify-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:shadow-lg hover:shadow-brand-orange-500/25"
                >
                  <Play className="w-5 h-5" />
                  {isEnrolled && completedLessonIds.size > 0 ? 'Continue Learning' : 'Start Course'}
                </Link>
                {!user && (
                  <Link
                    href={`/login?redirect=/courses/${courseId}`}
                    className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-xl font-semibold transition-all backdrop-blur-sm"
                  >
                    Sign In to Track Progress
                  </Link>
                )}
              </div>
            )}

            {/* Progress bar for enrolled */}
            {isEnrolled && (
              <div className="max-w-md mt-6">
                <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                  <span>{completedLessonIds.size} of {lessons?.length || 0} lessons complete</span>
                  <span className="font-bold text-white">{progressPercent}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5">
                  <div
                    className="bg-white h-2.5 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Course Curriculum — grouped by week/module */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main: Module accordion */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
              Course Curriculum
            </h2>
            <p className="text-slate-500 mb-8">
              12-week program &middot; {lessons?.length || 0} lessons &middot; EPA 608 Universal + OSHA 30 + CPR
            </p>

            <div className="space-y-3">
              {moduleGroups.map((mod: any) => {
                const allDone = mod.lessons.length > 0 && mod.completedCount === mod.lessons.length;
                return (
                  <details
                    key={mod.id}
                    className={`group rounded-xl border-2 transition-colors ${
                      allDone
                        ? 'border-brand-green-200 bg-brand-green-50/30'
                        : 'border-slate-200 bg-white hover:border-brand-blue-200'
                    }`}
                  >
                    <summary className="flex items-center gap-4 p-4 sm:p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      {/* Module number badge */}
                      <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-sm sm:text-base ${
                        allDone
                          ? 'bg-brand-green-100 text-brand-green-700'
                          : 'bg-brand-blue-100 text-brand-blue-700'
                      }`}>
                        {allDone ? '✓' : mod.order_index}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">{mod.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                          {mod.lessons.length} lessons
                          {isEnrolled && ` · ${mod.completedCount}/${mod.lessons.length} complete`}
                        </p>
                      </div>

                      {/* Progress ring for enrolled */}
                      {isEnrolled && mod.lessons.length > 0 && (
                        <div className="hidden sm:flex items-center gap-2">
                          <div className="w-8 h-8 relative">
                            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                              <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200" />
                              <circle
                                cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="3"
                                className={allDone ? 'text-brand-green-500' : 'text-brand-blue-500'}
                                strokeDasharray={`${(mod.completedCount / mod.lessons.length) * 88} 88`}
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        </div>
                      )}

                      <ChevronDown className="w-5 h-5 text-slate-400 transition-transform group-open:rotate-180 flex-shrink-0" />
                    </summary>

                    {/* Module description */}
                    {mod.description && (
                      <p className="px-5 pb-2 text-sm text-slate-500 -mt-1">{mod.description}</p>
                    )}

                    {/* Lesson list */}
                    <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                      {mod.lessons.map((lesson: any, idx: number) => {
                        const isCompleted = completedLessonIds.has(lesson.id);
                        const lessonHref = `/courses/${courseId}/lessons/${lesson.id}`;

                        return (
                          <Link
                            key={lesson.id}
                            href={lessonHref}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                              isCompleted
                                ? 'bg-brand-green-50 hover:bg-brand-green-100'
                                : 'hover:bg-white'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCompleted
                                ? 'bg-brand-green-200 text-brand-green-700'
                                : 'bg-white text-slate-500'
                            }`}>
                              {isCompleted ? '✓' : idx + 1}
                            </div>
                            <span className={`flex-1 text-sm font-medium truncate ${
                              isCompleted ? 'text-brand-green-800' : 'text-slate-700'
                            }`}>
                              {lesson.title}
                            </span>
                            {lesson.duration_minutes && (
                              <span className="text-xs text-slate-500 flex-shrink-0">
                                {lesson.duration_minutes} min
                              </span>
                            )}
                            {!isCompleted && (
                              <Play className="w-4 h-4 text-brand-blue-400 flex-shrink-0" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 sm:p-8 sticky top-24">
              <h3 className="text-xl font-black text-slate-900 mb-6">
                {isEnrolled ? 'Your Progress' : 'Program Details'}
              </h3>

              {isEnrolled && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-600">{completedLessonIds.size}/{lessons?.length || 0} lessons</span>
                    <span className="font-bold text-brand-blue-600">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-white h-3 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-blue-50 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Duration</div>
                    <div className="text-sm text-slate-500">15 weeks &middot; {course.duration_hours || 375} hours</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-blue-50 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Lessons</div>
                    <div className="text-sm text-slate-500">{lessons?.length || 0} video lessons + quizzes</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-blue-50 flex items-center justify-center">
                    <Award className="h-5 w-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Certifications</div>
                    <div className="text-sm text-slate-500">EPA 608 Universal, OSHA 30, CPR</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-blue-50 flex items-center justify-center">
                    <Wrench className="h-5 w-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Hands-On</div>
                    <div className="text-sm text-slate-500">Lab exercises + OJT internship</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-blue-50 flex items-center justify-center">
                    <Users className="h-5 w-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Access</div>
                    <div className="text-sm text-slate-500">Lifetime access after enrollment</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {firstLesson && (
                  <Link
                    href={`/courses/${courseId}/lessons/${(isEnrolled && nextLesson ? nextLesson : firstLesson).id}`}
                    className="block w-full text-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-6 py-4 rounded-xl font-bold transition-colors"
                  >
                    {isEnrolled && completedLessonIds.size > 0 ? 'Continue Learning' : 'Start Course'}
                  </Link>
                )}
                {isEnrolled && (
                  <Link
                    href="/learner/dashboard"
                    className="block w-full text-center border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:border-slate-400 transition-colors"
                  >
                    Back to Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
