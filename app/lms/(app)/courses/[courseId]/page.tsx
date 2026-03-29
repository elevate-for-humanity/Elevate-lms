
import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';
import {
  Play, Clock, BookOpen, Award, Lock, ChevronRight,
  CheckCircle, Shield, FileText, Zap, FlaskConical,
  Brain, ClipboardList, Video,
} from 'lucide-react';
import { CourseModuleAccordion } from '@/components/lms/CourseModuleAccordion';

export const dynamic = 'force-dynamic';

type Params = Promise<{ courseId: string }>;

async function resolveCourse(courseId: string) {
  const db = createAdminClient();
  const { data: course } = await db
    .from('courses')
    .select('id, title, description, short_description, status, is_active, program_id, slug')
    .eq('id', courseId)
    .maybeSingle();
  if (course) return { ...course, _lessonCourseId: course.id };

  const { data: tc } = await db
    .from('training_courses')
    .select('id, title, description, is_active, slug')
    .eq('id', courseId)
    .maybeSingle();
  if (!tc) return null;

  let lessonCourseId = tc.id;
  const { data: canonicalCourse } = await db
    .from('courses').select('id').eq('slug', tc.slug).maybeSingle();
  if (canonicalCourse?.id) lessonCourseId = canonicalCourse.id;

  return {
    id: tc.id, title: tc.title, description: tc.description,
    short_description: null, status: 'published', is_active: tc.is_active,
    program_id: null, slug: tc.slug, _lessonCourseId: lessonCourseId,
  };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { courseId } = await params;
  const course = await resolveCourse(courseId);
  return {
    title: course ? `${course.title} | Elevate LMS` : 'Course | Elevate LMS',
    description: course?.description || 'View course details and lessons.',
  };
}

export default async function CoursePage({ params }: { params: Params }) {
  const { courseId } = await params;
  const supabase = await createClient();
  const db = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/courses/' + courseId);

  if (!db) {
    // Admin client unavailable — service role key not configured.
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Course data unavailable. Please contact support.
      </div>
    );
  }

  const course = await resolveCourse(courseId);
  if (!course) notFound();

  // lessonCourseId is the canonical courses UUID — may differ from the URL
  // param when the URL uses a training_courses ID (e.g. legacy HVAC routes).
  // All downstream queries — including enrollment — must use this value.
  const lessonCourseId = (course as any)._lessonCourseId || courseId;

  const { data: program } = course.program_id
    ? await supabase.from('programs')
        .select('image_url, hero_image_url, credential_name, credential_type, credential')
        .eq('id', course.program_id).single()
    : { data: null };

  const heroImage = program?.hero_image_url || program?.image_url || '/images/pages/hvac-unit.jpg';
  const credentialName = program?.credential_name || program?.credential || null;

  // Check if user is admin/staff — they bypass enrollment requirements entirely.
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdminUser = ['admin', 'super_admin', 'staff'].includes(profile?.role ?? '');

  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('status, enrollment_state, enrolled_at')
    .eq('user_id', user.id).eq('course_id', lessonCourseId).maybeSingle();

  if (!isAdminUser && enrollment?.status === 'revoked') redirect('/lms/programs');
  if (!isAdminUser && enrollment?.enrollment_state === 'pending_funding_verification')
    redirect(`/lms/enrollment-pending?courseId=${lessonCourseId}`);

  // Admins are always treated as enrolled — they should never see "Enroll Now".
  const isPendingApproval = !isAdminUser && enrollment?.status === 'pending_approval';

  const { data: modulesRaw } = await db
    .from('course_modules').select('id, title, order_index')
    .eq('course_id', lessonCourseId).order('order_index', { ascending: true });

  const { data: lessonsRaw } = await db
    .from('lms_lessons')
    .select('id, title, duration_minutes, order_index, content_type, step_type, module_id, activities, lesson_slug, passing_score')
    .eq('course_id', lessonCourseId).order('order_index', { ascending: true });

  const allLessons = (lessonsRaw || []) as any[];

  const { data: lessonProgress } = await supabase
    .from('lesson_progress').select('lesson_id, completed, completed_at')
    .eq('user_id', user.id)
    .in('lesson_id', allLessons.map((l) => l.id));

  const progressMap = new Map((lessonProgress || []).map((p: any) => [p.lesson_id, p]));

  const modules = (modulesRaw || []).map((mod: any) => ({
    ...mod,
    lessons: allLessons
      .filter((l) => l.module_id === mod.id)
      .sort((a: any, b: any) => a.order_index - b.order_index),
  }));

  const ungrouped = allLessons.filter((l) => !l.module_id);
  const completedCount = allLessons.filter((l) => progressMap.get(l.id)?.completed).length;
  const progressPct = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;
  const nextLesson = allLessons.find((l) => !progressMap.get(l.id)?.completed);
  const totalMinutes = allLessons.reduce((sum: number, l: any) => sum + (l.duration_minutes || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const checkpointCount = allLessons.filter((l) =>
    l.step_type === 'checkpoint' || l.content_type === 'quiz').length;
  const isEnrolled = isAdminUser || (!!enrollment && !isPendingApproval);

  // Derive activity types actually present across all lessons from DB records.
  // activities is stored as JSONB — either {video:true, reading:true, ...}
  // or [{type:'video'}, ...]. Handle both shapes.
  const activityTypeSet = new Set<string>();
  for (const l of allLessons) {
    if (!l.activities) continue;
    if (Array.isArray(l.activities)) {
      // Array shape: [{type:'video'}, ...]
      for (const a of l.activities) {
        if (a?.type) activityTypeSet.add(a.type);
      }
    } else if (typeof l.activities === 'object') {
      // Object shape: {video: true, reading: true, ...}
      for (const [key, val] of Object.entries(l.activities)) {
        if (val) activityTypeSet.add(key);
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HERO */}
      <div className="relative h-[220px] sm:h-[300px] w-full overflow-hidden bg-slate-900">
        <Image src={heroImage} alt={course.title} fill className="object-cover object-center opacity-60" priority />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
          <nav className="flex items-center gap-1.5 text-xs text-white/60 mb-3">
            <Link href="/lms/courses" className="hover:text-white">My Courses</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/80">Course Overview</span>
          </nav>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight drop-shadow">{course.title}</h1>
          {credentialName && (
            <div className="flex items-center gap-2 mt-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-300 font-semibold">Prepares for {credentialName}</span>
            </div>
          )}
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-5 py-4">
            {([
              { icon: BookOpen,      label: `${allLessons.length} Lessons` },
              { icon: Clock,         label: totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${remainingMinutes}m` },
              { icon: ClipboardList, label: `${checkpointCount} Checkpoints` },
              { icon: Award,         label: 'Certificate' },
            ] as const).map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                <Icon className="w-4 h-4 text-slate-400" />{label}
              </span>
            ))}
            <div className="ml-auto flex items-center gap-3">
              {isEnrolled && (
                <div className="flex items-center gap-2">
                  <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-blue-600 rounded-full" style={{ width: `${progressPct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{progressPct}%</span>
                </div>
              )}
              {isEnrolled && nextLesson && (
                <Link href={`/lms/courses/${courseId}/lessons/${nextLesson.id}`}
                  className="flex items-center gap-1.5 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition">
                  <Play className="w-3.5 h-3.5" />{completedCount > 0 ? 'Continue' : 'Start Course'}
                </Link>
              )}
              {isEnrolled && !nextLesson && (
                <span className="flex items-center gap-1.5 text-green-700 font-bold text-sm bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                  <CheckCircle className="w-4 h-4" /> Complete
                </span>
              )}
              {!enrollment && (
                <Link href={`/lms/courses/${courseId}/enroll`}
                  className="flex items-center gap-1.5 bg-brand-red-600 hover:bg-brand-red-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition">
                  Enroll Now
                </Link>
              )}
              {enrollment && isPendingApproval && (
                <span className="flex items-center gap-1.5 text-amber-700 font-bold text-sm bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                  <Clock className="w-4 h-4" /> Pending Approval
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* MODULE ACCORDION */}
          <div className="lg:col-span-2">
            {(course.description || course.short_description) && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">About This Course</h2>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {course.short_description || course.description}
                </p>
              </div>
            )}
            <h2 className="text-lg font-extrabold text-slate-900 mb-4">Course Content</h2>
            {modules.length > 0 ? (
              <CourseModuleAccordion
                modules={modules}
                courseId={courseId}
                progressMap={Object.fromEntries(progressMap)}
                isEnrolled={isEnrolled}
                isPendingApproval={!!isPendingApproval}
              />
            ) : ungrouped.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {ungrouped.map((lesson: any, index: number) => {
                  const isCompleted = progressMap.get(lesson.id)?.completed;
                  const prevDone = index === 0 || progressMap.get(ungrouped[index - 1]?.id)?.completed;
                  const isLocked = isPendingApproval || (!enrollment && index > 0) || (enrollment && !isCompleted && !prevDone);
                  const isCheckpoint = lesson.step_type === 'checkpoint' || lesson.content_type === 'quiz';
                  return (
                    <div key={lesson.id} className="border-b border-slate-100 last:border-b-0">
                      {isLocked ? (
                        <div className="flex items-center gap-3 px-4 py-3.5 opacity-40 cursor-not-allowed">
                          <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-700">{lesson.title}</span>
                        </div>
                      ) : (
                        <Link href={`/lms/courses/${courseId}/lessons/${lesson.id}`}
                          className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition group">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-green-500' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                            {isCompleted ? <CheckCircle className="w-4 h-4 text-white" /> : <Play className="w-3 h-3 text-slate-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${isCompleted ? 'text-green-800' : 'text-slate-900'}`}>{lesson.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {isCheckpoint && <span className="text-[10px] font-bold text-brand-orange-600 bg-brand-orange-50 border border-brand-orange-200 px-1.5 py-0.5 rounded">CHECKPOINT</span>}
                              {lesson.duration_minutes && <span className="text-xs text-slate-400">{lesson.duration_minutes} min</span>}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No lessons available yet.</p>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              {isEnrolled ? (
                <>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-600 font-medium">Your Progress</span>
                      <span className="font-bold text-slate-900">{progressPct}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-blue-600 rounded-full" style={{ width: `${progressPct}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">{completedCount} of {allLessons.length} lessons complete</p>
                  </div>
                  {nextLesson ? (
                    <Link href={`/lms/courses/${courseId}/lessons/${nextLesson.id}`}
                      className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white py-3 rounded-xl font-bold transition text-sm">
                      <Play className="w-4 h-4" />{completedCount > 0 ? 'Continue Learning' : 'Start Course'}
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-3 bg-green-50 text-green-800 rounded-xl font-bold text-sm border border-green-200">
                      <CheckCircle className="w-4 h-4" /> Course Complete
                    </div>
                  )}
                </>
              ) : enrollment && isPendingApproval ? (
                <div className="text-center py-2">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-bold text-slate-900 text-sm mb-1">Enrollment Under Review</p>
                  <p className="text-xs text-slate-500">We will email you when confirmed.</p>
                </div>
              ) : (
                <Link href={`/lms/courses/${courseId}/enroll`}
                  className="w-full flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white py-3 rounded-xl font-bold transition text-sm">
                  Enroll Now — Free to Apply
                </Link>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Course Details</h3>
              <dl className="space-y-3">
                {[
                  { label: 'Modules',     value: modules.length || '—' },
                  { label: 'Lessons',     value: allLessons.length },
                  { label: 'Duration',    value: totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${remainingMinutes}m` },
                  { label: 'Checkpoints', value: checkpointCount },
                  { label: 'Certificate', value: 'Included' },
                  { label: 'Level',       value: 'Beginner–Intermediate' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="text-xs font-semibold text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {activityTypeSet.size > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Each Lesson Includes</h3>
                <ul className="space-y-2.5">
                  {([
                    { type: 'video',       icon: Video,        label: 'Instructor Video',   color: 'text-brand-blue-600' },
                    { type: 'reading',     icon: FileText,     label: 'Reading & Notes',    color: 'text-slate-500' },
                    { type: 'flashcards',  icon: Brain,        label: 'Flashcards',         color: 'text-purple-600' },
                    { type: 'lab',         icon: FlaskConical, label: 'Hands-On Lab',       color: 'text-green-600' },
                    { type: 'practice',    icon: Zap,          label: 'Practice Questions', color: 'text-amber-600' },
                    { type: 'checkpoint',  icon: Shield,       label: 'Checkpoint Quiz',    color: 'text-brand-red-600' },
                  ] as const).filter(({ type }) => activityTypeSet.has(type)).map(({ icon: Icon, label, color }) => (
                    <li key={label} className="flex items-center gap-2.5 text-sm text-slate-700">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {credentialName && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Credential</h3>
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{credentialName}</p>
                    {program?.credential_type && <p className="text-xs text-slate-500 mt-0.5">{program.credential_type}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
