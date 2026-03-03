export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';
import {
  Play,
  Clock,
  BookOpen,
  Award,
  Lock,
  ChevronRight,
  Users,
  Star,
  FileText,
  Video,
  MessageSquare,
  Bot,
CheckCircle, } from 'lucide-react';
import { DiscussionForum } from '@/components/DiscussionForum';
import AIInstructor from '@/components/AIInstructor';
import AvatarCourseGuide from '@/components/AvatarCourseGuide';
import VoiceoverPlayer from '@/components/VoiceoverPlayer';
import { UniversalCoursePlayer } from '@/components/UniversalCoursePlayer';

type Params = Promise<{ courseId: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { courseId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  if (!supabase) {
    return { title: 'Course | Elevate LMS' };
  }

  const { data: course } = await db
    .from('training_courses')
    .select('course_name, description')
    .eq('id', courseId)
    .single();

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
}

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
}

export default async function CoursePage({ params }: { params: Params }) {
  const { courseId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/lms/courses/' + courseId);
  }

  // Fetch the course
  const { data: course, error } = await db
    .from('training_courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error || !course) {
    notFound();
  }

  // Check enrollment and approval status
  const { data: enrollment } = await db
    .from('training_enrollments')
    .select('status, approved_at, approved_by')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  const isPendingApproval = enrollment?.status === 'pending_approval' || (enrollment && !enrollment.approved_at);

  // Fetch lessons
  const { data: lessons } = await db
    .from('training_lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  const typedLessons = (lessons || []) as Lesson[];

  // Fetch lesson progress
  const { data: lessonProgress } = await db
    .from('lesson_progress')
    .select('lesson_id, completed, completed_at')
    .eq('user_id', user.id)
    .in('lesson_id', typedLessons.map(l => l.id));

  const progressMap = new Map(
    (lessonProgress || []).map((p: LessonProgress) => [p.lesson_id, p])
  );

  // Calculate progress
  const completedLessons = typedLessons.filter(l => progressMap.get(l.id)?.completed).length;
  const progressPercentage = typedLessons.length > 0 
    ? Math.round((completedLessons / typedLessons.length) * 100) 
    : 0;

  // Find next lesson to continue
  const nextLesson = typedLessons.find(l => !progressMap.get(l.id)?.completed);

  // Calculate total duration
  const totalMinutes = typedLessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  // Fetch quizzes for this course
  const { data: quizzes } = await db
    .from('quizzes')
    .select('id, title')
    .eq('course_id', courseId);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Course Header — image hero */}
      <div className="relative h-[200px] sm:h-[280px] md:h-[340px]">
        <Image
          src={course.thumbnail_url || '/images/programs-hq/training-classroom.jpg'}
          alt={course.course_name}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </div>
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <nav className="flex items-center gap-2 text-white/70 text-sm mb-4">
                <Link href="/lms/dashboard" className="hover:text-white transition">Dashboard</Link>
                <ChevronRight className="w-4 h-4" />
                <Link href="/lms/courses" className="hover:text-white transition">Courses</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white">{course.course_name}</span>
              </nav>

              <h1 className="text-3xl md:text-4xl font-black mb-4">{course.course_name}</h1>
              
              {course.description && (
                <p className="text-white/85 text-lg mb-6 max-w-xl">{course.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-6 text-sm text-white/90">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>{typedLessons.length} Lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>
                    {totalHours > 0 ? `${totalHours}h ` : ''}{remainingMinutes}m
                  </span>
                </div>
                {quizzes && quizzes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    <span>{quizzes.length} Quiz{quizzes.length !== 1 ? 'zes' : ''}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <span>Certificate</span>
                </div>
              </div>

              {/* Credential alignment banner */}
              {course.certification_name && (
                <div className="mt-6 flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 border border-white/10">
                  <Award className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <p className="text-sm text-white/90">
                    <span className="text-amber-400 font-semibold">Credential Alignment:</span>{' '}
                    This course prepares you for{' '}
                    <span className="font-medium">{course.certification_name}</span>
                    {course.certification_body && (
                      <span className="text-white/50"> issued by {course.certification_body}</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Course Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 text-slate-900">
              {course.thumbnail_url ? (
                <div className="relative h-40 rounded-xl overflow-hidden mb-4">
                  <Image
                    src={course.thumbnail_url}
                    alt={course.course_name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-40 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="w-12 h-12 text-slate-300" />
                </div>
              )}

              {enrollment && isPendingApproval ? (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-5 h-5 text-amber-600" />
                      <span className="font-semibold text-amber-900">Pending Admin Approval</span>
                    </div>
                    <p className="text-amber-700 text-sm">
                      Your enrollment is being reviewed. You&apos;ll receive an email when approved and can begin lessons.
                    </p>
                  </div>
                  <div className="w-full flex items-center justify-center gap-2 bg-slate-200 text-slate-500 py-3 rounded-xl font-semibold cursor-not-allowed">
                    <Lock className="w-5 h-5" />
                    Course Locked
                  </div>
                </>
              ) : enrollment ? (
                <>
                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-semibold">{progressPercentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-blue-600 rounded-full transition-all"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {nextLesson ? (
                    <Link
                      href={`/lms/courses/${courseId}/lessons/${nextLesson.id}`}
                      className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-blue-700 transition"
                    >
                      <Play className="w-5 h-5" />
                      {completedLessons > 0 ? 'Continue Learning' : 'Start Course'}
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-3 bg-brand-green-100 text-brand-green-800 rounded-xl font-semibold">
                      <span className="w-3 h-3 rounded-full bg-brand-green-500 inline-block" />
                      Course Completed!
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={`/lms/enroll?course=${courseId}`}
                  className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-blue-700 transition"
                >
                  Enroll Now
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Lessons List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Course Content</h2>
              {enrollment && typedLessons.length > 0 && (
                <span className="text-sm text-slate-500">
                  {completedLessons} of {typedLessons.length} completed
                </span>
              )}
            </div>

            {/* Progress bar for enrolled students */}
            {enrollment && typedLessons.length > 0 && (
              <div className="mb-4">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
            
            {typedLessons.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {typedLessons.map((lesson, index) => {
                  const progress = progressMap.get(lesson.id);
                  const isCompleted = progress?.completed;
                  // Lock if: pending approval, not enrolled, or previous lesson not done (sequential)
                  const previousDone = index === 0 || progressMap.get(typedLessons[index - 1]?.id)?.completed;
                  const isLocked = isPendingApproval || (!enrollment && index > 0) || (enrollment && !isPendingApproval && !isCompleted && !previousDone);

                  return (
                    <div
                      key={lesson.id}
                      className={`border-b border-slate-100 last:border-b-0 ${
                        isLocked ? 'opacity-50' : ''
                      }`}
                    >
                      {isLocked ? (
                        <div className="flex items-center gap-4 p-4 cursor-not-allowed" title="Complete the previous lesson first">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                            <Lock className="w-5 h-5 text-slate-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-slate-400">{lesson.title}</h3>
                            {lesson.duration_minutes && (
                              <p className="text-sm text-slate-400">{lesson.duration_minutes} min</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Link
                          href={`/lms/courses/${courseId}/lessons/${lesson.id}`}
                          className="flex items-center gap-4 p-4 hover:bg-slate-50 transition"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isCompleted
                              ? 'bg-brand-green-100'
                              : 'bg-brand-blue-100 text-brand-blue-600'
                          }`}>
                            {isCompleted ? (
                              <span className="w-3.5 h-3.5 rounded-full bg-brand-green-500 inline-block" />
                            ) : lesson.content_type === 'video' ? (
                              <Video className="w-5 h-5" />
                            ) : (
                              <FileText className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-medium ${isCompleted ? 'text-brand-green-800' : 'text-slate-900'}`}>{lesson.title}</h3>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                              {isCompleted ? (
                                <span className="text-brand-green-600 font-medium">Completed</span>
                              ) : (
                                <>
                                  {lesson.duration_minutes && (
                                    <span>{lesson.duration_minutes} min</span>
                                  )}
                                  {lesson.content_type && (
                                    <span className="capitalize">{lesson.content_type}</span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No lessons available yet.</p>
              </div>
            )}

            {/* Quizzes Section */}
            {quizzes && quizzes.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Quizzes</h2>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  {quizzes.map((quiz) => (
                    <Link
                      key={quiz.id}
                      href={`/lms/quizzes/${quiz.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-slate-50 transition border-b border-slate-100 last:border-b-0"
                    >
                      <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-brand-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900">{quiz.title}</h3>
                        <p className="text-sm text-slate-500">Quiz</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Stats */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Course Details</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Lessons</span>
                  <span className="font-medium">{typedLessons.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Duration</span>
                  <span className="font-medium">
                    {totalHours > 0 ? `${totalHours}h ` : ''}{remainingMinutes}m
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Quizzes</span>
                  <span className="font-medium">{quizzes?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Certificate</span>
                  <span className="font-medium text-brand-green-600">Yes</span>
                </div>
              </div>
            </div>

            {/* What You'll Learn */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">What You&apos;ll Learn</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-slate-600">Industry-relevant skills</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-slate-600">Hands-on practical experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-slate-600">Professional certification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-slate-600">Career-ready knowledge</span>
                </li>
              </ul>
            </div>

            {/* AI Instructor */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-brand-blue-600" />
                <h3 className="font-semibold text-slate-900">AI Study Assistant</h3>
              </div>
              <AIInstructor />
            </div>
          </div>
        </div>

        {/* Avatar Course Guide */}
        {enrollment && (
          <div className="mt-8">
            <AvatarCourseGuide
              avatarName="Elevate Guide"
              avatarRole="Course Assistant"
              steps={[
                { title: 'Welcome', message: `Welcome to ${course?.title || 'this course'}! Let me guide you through the content.`, videoUrl: '' },
                { title: 'Getting Started', message: 'Start with the first lesson and work through each module. Your instructor will review your progress at key checkpoints.', videoUrl: '' },
              ]}
            />
          </div>
        )}

        {/* Voiceover Player */}
        <div className="mt-4">
          <VoiceoverPlayer text={`Welcome to ${course?.title || 'this course'}. Let's get started with your learning journey.`} />
        </div>

        {/* Course Discussion Forum */}
        {enrollment && (
          <div className="mt-12">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="w-6 h-6 text-brand-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900">Course Discussions</h2>
            </div>
            <DiscussionForum />
          </div>
        )}
      </div>
    </div>
  );
}
