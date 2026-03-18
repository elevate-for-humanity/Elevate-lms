export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';
import {
  Play, Clock, BookOpen, Award, Lock, ChevronRight,
  FileText, CheckCircle, Shield,
} from 'lucide-react';
import { DiscussionForum } from '@/components/DiscussionForum';
import AIInstructor from '@/components/AIInstructor';

type Params = Promise<{ courseId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { courseId } = await params;
  const db = createAdminClient();
  const { data: course } = await db.from('training_courses').select('course_name, description').eq('id', courseId).single();
  return {
    title: course ? `${course.course_name} | Elevate LMS` : 'Course | Elevate LMS',
    description: course?.description || 'View course details and lessons.',
  };
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  order_index: number;
  content_type: string | null;
  step_type?: string | null;
}

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
}

export default async function CoursePage({ params }: { params: Params }) {
  const { courseId } = await params;
  const supabase = await createClient();
  const db = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/courses/' + courseId);

  const { data: course, error } = await db.from('training_courses').select('*').eq('id', courseId).single();
  if (error || !course) notFound();

  const { data: enrollment } = await db
    .from('training_enrollments')
    .select('status, approved_at')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  const isPendingApproval = enrollment?.status === 'pending_approval';

  const { data: lessons } = await db
    .from('lms_lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  const typedLessons = (lessons || []) as Lesson[];

  const { data: lessonProgress } = await db
    .from('lesson_progress')
    .select('lesson_id, completed, completed_at')
    .eq('user_id', user.id)
    .in('lesson_id', typedLessons.map(l => l.id));

  const progressMap = new Map((lessonProgress || []).map((p: LessonProgress) => [p.lesson_id, p]));
  const completedLessons = typedLessons.filter(l => progressMap.get(l.id)?.completed).length;
  const progressPct = typedLessons.length > 0 ? Math.round((completedLessons / typedLessons.length) * 100) : 0;
  const nextLesson = typedLessons.find(l => !progressMap.get(l.id)?.completed);
  const totalMinutes = typedLessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const checkpoints = typedLessons.filter(l => l.step_type === 'checkpoint' || l.content_type === 'quiz');

  return (
    <div className="min-h-screen bg-white">

      {/* HERO — image only, no text on top */}
      <div className="relative h-[280px] sm:h-[360px] w-full overflow-hidden">
        <Image
          src={course.thumbnail_url || '/images/pages/hvac-unit.jpg'}
          alt={course.course_name}
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* COURSE IDENTITY — below hero */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-5">
            <Link href="/learner/dashboard" className="hover:text-slate-700">Dashboard</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/learner/courses" className="hover:text-slate-700">My Courses</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700 font-medium">{course.course_name}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">
                {course.course_name}
              </h1>
              {course.description && (
                <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-6 max-w-2xl">
                  {course.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  { icon: BookOpen, label: `${typedLessons.length} Lessons` },
                  { icon: Clock, label: totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${remainingMinutes}m` },
                  { icon: FileText, label: `${checkpoints.length} Checkpoints` },
                  { icon: Award, label: 'Certificate Included' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200">
                    <Icon className="w-3.5 h-3.5" />{label}
                  </span>
                ))}
              </div>
              {course.certification_name && (
                <div className="inline-flex items-center gap-2 bg-slate-900 rounded-xl px-4 py-2.5">
                  <Award className="w-4 h-4 text-white flex-shrink-0" />
                  <p className="text-sm text-white font-semibold">
                    Prepares for {course.certification_name}
                    {course.certification_body && <span className="font-normal opacity-70"> · {course.certification_body}</span>}
                  </p>
                </div>
              )}
            </div>

            {/* Action card */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                {enrollment && !isPendingApproval ? (
                  <>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-600 font-medium">Your Progress</span>
                        <span className="font-bold text-slate-900">{progressPct}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-blue-600 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{completedLessons} of {typedLessons.length} lessons complete</p>
                    </div>
                    {nextLesson ? (
                      <Link
                        href={`/lms/courses/${courseId}/lessons/${nextLesson.id}`}
                        className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white py-3 rounded-xl font-bold transition text-sm"
                      >
                        <Play className="w-4 h-4" />
                        {completedLessons > 0 ? 'Continue Learning' : 'Start Course'}
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
                  <Link
                    href={`/lms/courses/${courseId}/enroll`}
                    className="w-full flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white py-3 rounded-xl font-bold transition text-sm"
                  >
                    Enroll Now
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="bg-white border-b border-slate-100 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: typedLessons.length, label: 'Total Lessons' },
              { value: totalHours > 0 ? `${totalHours}h` : `${remainingMinutes}m`, label: 'Training Time' },
              { value: checkpoints.length, label: 'Checkpoints' },
              { value: '1', label: 'Certificate' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl font-extrabold text-slate-900">{value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* Lesson list */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold text-slate-900">Course Content</h2>
              {enrollment && (
                <span className="text-sm font-medium text-slate-500">{completedLessons} / {typedLessons.length} complete</span>
              )}
            </div>

            {typedLessons.length > 0 ? (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                {typedLessons.map((lesson, index) => {
                  const isCompleted = progressMap.get(lesson.id)?.completed;
                  const previousDone = index === 0 || progressMap.get(typedLessons[index - 1]?.id)?.completed;
                  const isLocked = isPendingApproval || (!enrollment && index > 0) || (enrollment && !isCompleted && !previousDone);
                  const isCheckpoint = lesson.step_type === 'checkpoint' || lesson.content_type === 'quiz';

                  return (
                    <div key={lesson.id} className={`border-b border-slate-100 last:border-b-0 ${isLocked ? 'opacity-40' : ''}`}>
                      {isLocked ? (
                        <div className="flex items-center gap-4 px-4 py-3.5 cursor-not-allowed">
                          <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <p className="text-sm font-medium text-slate-700 flex-1">{lesson.title}</p>
                        </div>
                      ) : (
                        <Link
                          href={`/lms/courses/${courseId}/lessons/${lesson.id}`}
                          className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 transition group"
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted ? 'bg-green-500' : 'bg-slate-100 group-hover:bg-slate-200'
                          }`}>
                            {isCompleted
                              ? <CheckCircle className="w-4 h-4 text-white" />
                              : <Play className="w-3 h-3 text-slate-500" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${isCompleted ? 'text-green-800' : 'text-slate-900'}`}>
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {isCheckpoint && (
                                <span className="text-[10px] font-bold text-brand-orange-600 bg-brand-orange-50 border border-brand-orange-200 px-1.5 py-0.5 rounded">
                                  CHECKPOINT
                                </span>
                              )}
                              {lesson.duration_minutes && (
                                <span className="text-xs text-slate-400">{lesson.duration_minutes} min</span>
                              )}
                              {isCompleted && <span className="text-xs font-medium text-green-600">Completed</span>}
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
              <div className="rounded-xl border border-slate-200 p-10 text-center">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No lessons available yet.</p>
              </div>
            )}

            {enrollment && !isPendingApproval && (
              <div className="mt-10">
                <h2 className="text-xl font-extrabold text-slate-900 mb-4">AI Study Assistant</h2>
                <AIInstructor
                  courseId={courseId}
                  courseName={course.course_name}
                  systemPrompt="You are an expert HVAC instructor helping students prepare for EPA 608 certification. Answer questions clearly and accurately."
                />
              </div>
            )}

            {enrollment && !isPendingApproval && (
              <div className="mt-10">
                <h2 className="text-xl font-extrabold text-slate-900 mb-4">Course Discussions</h2>
                <DiscussionForum />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-4">Course Details</h3>
              <dl className="space-y-3">
                {[
                  { label: 'Lessons', value: typedLessons.length },
                  { label: 'Duration', value: totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${remainingMinutes}m` },
                  { label: 'Checkpoints', value: checkpoints.length },
                  { label: 'Certificate', value: 'Yes' },
                  { label: 'Level', value: course.difficulty_level || 'Beginner' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <dt className="text-sm text-slate-500">{label}</dt>
                    <dd className="text-sm font-semibold text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {course.certification_name && (
              <div className="rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 mb-3">Credential</h3>
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-brand-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{course.certification_name}</p>
                    {course.certification_body && <p className="text-xs text-slate-500 mt-0.5">{course.certification_body}</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-3">Aligned With</h3>
              <div className="space-y-2">
                {['EPA 608', 'ASHRAE Standards', 'DOL Apprenticeship'].map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm text-slate-700">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {!enrollment && (
              <Link
                href={`/lms/courses/${courseId}/enroll`}
                className="block w-full text-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-3.5 rounded-xl transition text-sm"
              >
                Enroll Now — Free to Apply
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
