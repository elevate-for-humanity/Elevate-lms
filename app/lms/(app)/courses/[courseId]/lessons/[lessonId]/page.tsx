
'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquare,
  BookOpen,
  Download,
  ClipboardList,
CheckCircle, } from 'lucide-react';
import { QuizSystem } from '@/components/lms/QuizSystem';
import QuizPlayer from '@/components/lms/QuizPlayer';
import LessonPlayer from '@/components/lms/LessonPlayer';
import StepSubmissionForm from '@/components/lms/StepSubmissionForm';
import InteractiveVideoPlayer from '@/components/lms/InteractiveVideoPlayer';
import { sanitizeRichHtml } from '@/lib/security/sanitize-html';
import { NoteTaking } from '@/components/NoteTaking';
import DigitalBinder from '@/components/DigitalBinder';
import { HVAC_QUIZ_MAP } from '@/lib/courses/hvac-quiz-map';
import { HVAC_LESSON_UUID } from '@/lib/courses/hvac-uuids';
import { buildLessonContent, isPlaceholderContent } from '@/lib/courses/hvac-content-builder';
import dynamic from 'next/dynamic';
import { lessonUuidToSimulationKey } from '@/lib/lms/hvac-simulations';
import { HVAC_QUICK_CHECKS } from '@/lib/courses/hvac-quick-checks';

const LessonVideoWithSimulation = dynamic(
  () => import('@/components/lms/LessonVideoWithSimulation'),
  { ssr: false }
);

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [course, setCourse] = useState<any>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [enrollmentBlocked, setEnrollmentBlocked] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  // checkpointBlocked: true when the previous module's checkpoint has not been passed.
  // Prevents advancing past a failed checkpoint into the next module.
  const [checkpointBlocked, setCheckpointBlocked] = useState(false);
  const [passedCheckpointIds, setPassedCheckpointIds] = useState<Set<string>>(new Set());
  const lessonStartTime = React.useRef(Date.now());

  useEffect(() => {
    lessonStartTime.current = Date.now();
    fetchLessonData();
  }, [lessonId]);

  const fetchLessonData = async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = await createClient();

    // Check enrollment via server API (bypasses RLS — no student SELECT policy on training_enrollments)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const enrollRes = await fetch(`/api/lms/enrollment-status?courseId=${courseId}`);
        const enrollData = enrollRes.ok ? await enrollRes.json() : null;

        if (!enrollData?.enrolled || enrollData.status === 'pending_approval') {
          setEnrollmentBlocked(true);
          return;
        }
      } catch {
        // Network error — don't block, let lesson load attempt continue
      }
    }

    // 1. Fetch lesson data
    const { data: lessonData } = await supabase
      .from('lms_lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    const { data: lessonsData } = await supabase
      .from('lms_lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');

    const { data: courseData } = await supabase
      .from('training_courses')
      .select('*')
      .eq('id', courseId)
      .single();

    // 2. Set state
    if (lessonData) {
      // If quiz lesson has no quiz_questions, fall back to local quiz bank
      let quizQuestions = lessonData.quiz_questions;
      let quizPassingScore = lessonData.passing_score;
      if (lessonData.content_type === 'quiz' && (!quizQuestions || quizQuestions.length === 0)) {
        // Reverse-lookup: UUID → definition ID → quiz config
        const defId = Object.entries(HVAC_LESSON_UUID).find(([, uuid]) => uuid === lessonData.id)?.[0];
        if (defId && HVAC_QUIZ_MAP[defId]) {
          quizQuestions = HVAC_QUIZ_MAP[defId].questions;
          quizPassingScore = quizPassingScore || HVAC_QUIZ_MAP[defId].passingScore;
        }
      }
      // Enrich placeholder content with generated rich HTML
      let enrichedContent = lessonData.content;
      if (isPlaceholderContent(lessonData.content)) {
        const defId = Object.entries(HVAC_LESSON_UUID).find(([, uuid]) => uuid === lessonData.id)?.[0];
        if (defId) {
          enrichedContent = buildLessonContent(defId);
        }
      }

      setLesson({
        ...lessonData,
        content: enrichedContent || lessonData.content,
        quiz_questions: quizQuestions || lessonData.quiz_questions,
        passing_score: quizPassingScore || lessonData.passing_score,
        quiz_id: lessonData.quiz_id || (quizQuestions?.length ? lessonData.id : null),
        resources: lessonData.resources || [],
      });
    }

    if (lessonsData) {
      setLessons(lessonsData);
    }

    if (courseData) {
      const completedCount =
        lessonsData?.filter((l) => l.completed).length || 0;
      setCourse({
        ...courseData,
        totalLessons: lessonsData?.length || 0,
        completedLessons: completedCount,
      });
    }

    // 3. Fetch user progress in background
    try {
      if (user && lessonsData) {
        const progressRes = await fetch(`/api/lms/progress?courseId=${courseId}`);
        const progressData = progressRes.ok ? await progressRes.json() : { progress: [] };
        const allProgress = progressData.progress;

        if (allProgress) {
          const completedIds = new Set(
            allProgress.filter((p: any) => p.completed).map((p: any) => p.lesson_id)
          );
          setCompletedLessonIds(completedIds);
          setIsCompleted(completedIds.has(lessonId));
        }
      }
    } catch {
      // Auth/progress fetch failed — lesson still renders fine
    }

    // 4. Fetch learner progress via engine API (covers checkpoint_scores +
    //    step_submissions in one call). Replaces direct Supabase checkpoint query.
    try {
      if (user) {
        const res = await fetch(`/api/lms/progress?courseId=${courseId}`);
        if (res.ok) {
          const data = await res.json();
          // completedLessonIds already set above from lesson_progress; merge with engine result
          if (Array.isArray(data.completedLessonIds)) {
            setCompletedLessonIds(new Set<string>(data.completedLessonIds));
            setIsCompleted(data.completedLessonIds.includes(lessonId));
          }
          // Passed checkpoint IDs from engine checkpoint_scores
          if (data.checkpointScores) {
            const passedIds = new Set<string>(
              Object.entries(data.checkpointScores as Record<string, { passed: boolean }>)
                .filter(([, v]) => v.passed)
                .map(([k]) => k)
            );
            setPassedCheckpointIds(passedIds);
          }
        }
      }
    } catch {
      // Fail open — lesson still renders without gating data
    }

    // 5. Determine if the current lesson is blocked by an unpassed checkpoint.
    // A lesson is blocked when it is in module N and the checkpoint for module N-1
    // has not been passed. Only applies to curriculum_lessons (lesson_source = 'curriculum').
    if (lessonData && lessonsData && lessonData.lesson_source === 'curriculum' && lessonData.module_order > 1) {
      const prevModuleOrder = lessonData.module_order - 1;
      const prevCheckpoint = lessonsData.find(
        (l: any) => l.module_order === prevModuleOrder && l.step_type === 'checkpoint'
      );
      if (prevCheckpoint && !passedCheckpointIds.has(prevCheckpoint.id)) {
        setCheckpointBlocked(true);
      }
    }
  };

  const markComplete = async () => {
    const newStatus = !isCompleted;
    setIsCompleted(newStatus);
    setCompletionError(null);

    try {
      if (newStatus) {
        const elapsedSeconds = Math.round((Date.now() - lessonStartTime.current) / 1000);
        const response = await fetch(`/api/lessons/${lessonId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timeSpentSeconds: elapsedSeconds }),
        });

        if (!response.ok) {
          setIsCompleted(false);
          try {
            const err = await response.json();
            if (err.code === 'CHECKPOINT_NOT_PASSED') {
              // Server-side gate fired — surface the exact message from the API
              // which includes checkpoint title and required score.
              setCompletionError(err.error ?? 'You must pass the previous module checkpoint before continuing.');
              setCheckpointBlocked(true);
            } else if (err.required && err.actual != null) {
              const remaining = Math.ceil((err.required - err.actual) / 60);
              setCompletionError(`Please spend at least ${remaining} more minute${remaining !== 1 ? 's' : ''} on this lesson before marking it complete.`);
            } else {
              setCompletionError(err.error ?? 'Unable to mark complete. Please try again.');
            }
          } catch {
            setCompletionError('Unable to mark complete. Please try again.');
          }
          return;
        }

        const result = await response.json();

        // Update sidebar completion state
        setCompletedLessonIds((prev) => new Set<string>([...Array.from(prev), lessonId]));

        // Handle course completion — auto-advance to certification page
        if (result.courseProgress?.courseCompleted) {
          setCourseCompleted(true);
          if (result.certificate) {
            setCertificate(result.certificate);
          }
          // Auto-advance: redirect to certification outcome page instead of
          // leaving learner on the lesson player with a manual complete button
          router.push(`/lms/courses/${courseId}/certification`);
          return;
        }

        // Auto-advance to next lesson after marking complete
        if (hasNext) {
          router.push(`/lms/courses/${courseId}/lessons/${lessons[currentIndex + 1].id}`);
        }
      } else {
        const response = await fetch(`/api/lessons/${lessonId}/complete`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          setIsCompleted(true);
          return;
        }

        // Remove from completed set
        setCompletedLessonIds((prev) => {
          const next = new Set(prev);
          next.delete(lessonId);
          return next;
        });
        setCourseCompleted(false);
        setCertificate(null);
      }
    } catch (error) {
      setIsCompleted(!newStatus);
    }
  };

  const currentIndex = lessons.findIndex((l) => l.id === lessonId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < lessons.length - 1;

  const goToPrevious = () => {
    if (hasPrevious) {
      router.push(
        `/lms/courses/${courseId}/lessons/${lessons[currentIndex - 1].id}`
      );
    }
  };

  const goToNext = () => {
    if (hasNext) {
      router.push(
        `/lms/courses/${courseId}/lessons/${lessons[currentIndex + 1].id}`
      );
    }
  };

  // Timeout: if lesson hasn't loaded after 30s, show error
  const [loadTimeout, setLoadTimeout] = useState(false);
  useEffect(() => {
    if (lesson) { setLoadTimeout(false); return; }
    const timer = setTimeout(() => {
      setLoadTimeout(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, [lesson]);

  if (enrollmentBlocked) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-white">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Enrollment Pending Approval</h2>
          <p className="text-slate-600 mb-2">
            Your enrollment is being reviewed by an administrator. You will receive an email once approved.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Course access is locked until an admin approves your enrollment.
          </p>
          <Link
            href="/learner/dashboard"
            className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-brand-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!lesson) {
    if (loadTimeout) {
      return (
        <div className="flex items-center justify-center h-[100dvh] bg-white">
          <div className="text-center max-w-md">
            <div className="w-12 h-12 bg-brand-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-brand-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Lesson Not Found</h2>
            <p className="text-slate-600 mb-6">
              This lesson could not be loaded. It may have been removed or you may not have access.
            </p>
            <Link
              href={`/lms/courses/${courseId}`}
              className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-brand-blue-700"
            >
              Back to Course
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-[100dvh] bg-white">
        {/* Skeleton sidebar */}
        <aside className="hidden md:block w-80 bg-white border-r p-4">
          <div className="h-5 bg-slate-200 rounded w-3/4 mb-4 animate-pulse" />
          <div className="h-2 bg-white rounded-full mb-6 animate-pulse" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-1 animate-pulse" />
                <div className="h-3 bg-white rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </aside>
        {/* Skeleton content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-brand-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading lesson...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Lms", href: "/lms" }, { label: "[Lessonid]" }]} />
      </div>
{/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-16 left-4 z-50 bg-white p-3 rounded-lg shadow-lg"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Lesson List */}
      <aside
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-80 max-w-[85vw] md:max-w-none bg-white border-r overflow-y-auto transition-transform duration-300 fixed md:relative h-full z-40`}
      >
        <div className="p-6 border-b">
          <Link
            href={`/lms/courses/${courseId}`}
            className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold mb-4 inline-block"
          >
            ← Back to Course
          </Link>
          <h2 className="font-bold text-lg">{course?.title}</h2>
          <div className="mt-3">
            <div className="text-sm text-black mb-1">
              {completedLessonIds.size} of {lessons.length} lessons
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-brand-green-600 h-2 rounded-full transition-all"
                style={{
                  width: `${lessons.length > 0 ? (completedLessonIds.size / lessons.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        <nav role="navigation" aria-label="Main navigation" className="p-4">
          {/* Group lessons by module_title when available, otherwise flat list */}
          {(() => {
            // Build module groups
            const groups: { title: string | null; lessons: typeof lessons }[] = [];
            for (const l of lessons) {
              const title = l.module_title ?? null;
              const last = groups[groups.length - 1];
              if (last && last.title === title) { last.lessons.push(l); }
              else { groups.push({ title, lessons: [l] }); }
            }
            const multiGroup = groups.length > 1 && groups.some(g => g.title);
            return groups.map((group, gi) => (
              <div key={gi} className="mb-2">
                {multiGroup && group.title && (
                  <div className="px-2 py-1.5 mb-1 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    {group.title}
                  </div>
                )}
                {group.lessons.map((l) => {
                  const idx = lessons.findIndex(x => x.id === l.id);
                  const lessonDone = completedLessonIds.has(l.id) || (l.id === lessonId && isCompleted);
                  const previousDone = idx === 0 || completedLessonIds.has(lessons[idx - 1]?.id);
                  const isLocked = !lessonDone && !previousDone && l.id !== lessonId;
                  const isCurrent = l.id === lessonId;
                  // Step type badge
                  const stepBadge = l.step_type === 'checkpoint' ? '⬡' : l.step_type === 'quiz' ? '?' : l.step_type === 'lab' ? '⚙' : null;

                  if (isLocked) {
                    return (
                      <div
                        key={l.id}
                        className="flex items-center gap-3 p-3 rounded-lg mb-1 opacity-40 cursor-not-allowed"
                        title="Complete the previous lesson first"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate text-slate-400">{l.title}</div>
                          <div className="text-xs text-slate-400">{l.duration}</div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={l.id}
                      href={`/lms/courses/${courseId}/lessons/${l.id}`}
                      className={`flex items-center gap-3 p-3 rounded-lg mb-1 transition ${
                        isCurrent
                          ? 'bg-brand-blue-50 border-l-4 border-brand-blue-600'
                          : 'hover:bg-white'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                          lessonDone
                            ? 'bg-brand-green-100 text-brand-green-600'
                            : isCurrent
                              ? 'bg-brand-blue-100 text-brand-blue-600'
                              : 'bg-white text-black'
                        }`}
                      >
                        {lessonDone ? (
                          <span className="w-3 h-3 rounded-full bg-brand-green-500 inline-block" />
                        ) : stepBadge ? (
                          <span>{stepBadge}</span>
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-sm truncate ${isCurrent ? 'text-brand-blue-900' : lessonDone ? 'text-brand-green-800' : 'text-black'}`}>
                          {l.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {lessonDone ? 'Completed' : l.step_type === 'checkpoint' ? 'Checkpoint' : l.step_type === 'lab' ? 'Lab' : l.step_type === 'assignment' ? 'Assignment' : l.duration}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ));
          })()}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Content area — routes by step_type first, then content_type for legacy */}
        {/* Checkpoint: module-boundary gate with reflection prompt */}
        {(lesson.step_type === 'checkpoint') && !lesson.quiz_questions?.length ? (
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-amber-600">Module Checkpoint</div>
                  <h2 className="text-xl font-bold text-slate-900">{lesson.title}</h2>
                </div>
              </div>
              {lesson.content && (
                <div className="prose max-w-none mb-6"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(lesson.content) }} />
              )}
              <div className="bg-white rounded-lg p-6 border border-amber-100">
                <p className="text-sm font-semibold text-slate-700 mb-2">Reflection</p>
                <p className="text-slate-600 text-sm">{lesson.description || 'Review the key concepts from this module before continuing.'}</p>
              </div>
            </div>
          </div>
        ) : lesson.step_type === 'lab' ? (
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-brand-blue-600">Hands-On Lab</div>
                  <h2 className="text-xl font-bold text-slate-900">{lesson.title}</h2>
                </div>
              </div>
              {lesson.content && (
                <div className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(lesson.content) }} />
              )}
              <StepSubmissionForm
                lessonId={lessonId}
                courseId={courseId}
                stepType="lab"
                lessonTitle={lesson.title}
              />
            </div>
          </div>
        ) : lesson.step_type === 'assignment' ? (
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-purple-600">Assignment</div>
                  <h2 className="text-xl font-bold text-slate-900">{lesson.title}</h2>
                </div>
              </div>
              {lesson.content && (
                <div className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(lesson.content) }} />
              )}
              <StepSubmissionForm
                lessonId={lessonId}
                courseId={courseId}
                stepType="assignment"
                lessonTitle={lesson.title}
              />
            </div>
          </div>
        ) : lesson.content_type === 'scorm' && lesson.scorm_package_id ? (
          <div className="h-[70vh]">
            <iframe
              src={`/api/scorm/content/${lesson.scorm_package_id}/${lesson.scorm_launch_path || 'index.html'}`}
              className="w-full h-full border-0"
              title={lesson.title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          </div>
        ) : lesson.content_type === 'quiz' && (lesson.quiz_questions?.length > 0 || lesson.quiz_id) ? (
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            <QuizPlayer
              questions={lesson.quiz_questions || []}
              title={lesson.title}
              onComplete={async (score, answers) => {
                const passingScore = lesson.passing_score || 70;
                const passed = score >= passingScore;

                // For checkpoint and exam steps, record the score via the engine API.
                // This is what the module gate reads — must be written before markComplete.
                if (lesson.step_type === 'checkpoint' || lesson.step_type === 'exam') {
                  try {
                    await fetch(`/api/lessons/${lessonId}/checkpoint`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        courseId,
                        moduleOrder: lesson.module_order ?? 0,
                        score,
                        passingScore,
                        answers: answers ?? {},
                      }),
                    });

                    if (passed) {
                      setPassedCheckpointIds(prev => new Set<string>([...Array.from(prev), lessonId]));
                      setCheckpointBlocked(false);
                    }
                  } catch {
                    // Non-fatal — fail open so the lesson still renders
                  }
                }

                if (passed) {
                  markComplete();
                }
              }}
              passingScore={lesson.passing_score || 70}
            />
          </div>
        ) : lesson.video_url && !lesson.video_url.includes('/generated/lessons/') && lessonUuidToSimulationKey[lessonId] ? (
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            {/* Video + 3D simulation lesson */}
            <LessonVideoWithSimulation
              lessonKey={lessonUuidToSimulationKey[lessonId]}
              videoUrl={lesson.video_url}
              minimumTimeSeconds={120}
              onMinimumTimeReached={() => {
                // Simulation unlocked — no action needed yet
              }}
              onSimulationComplete={() => {
                if (!isCompleted) {
                  setIsCompleted(true);
                  markComplete();
                }
              }}
            />
            {/* Show lesson content below simulation */}
            {lesson.content && (
              <div className="mt-6 bg-white rounded-xl p-8 shadow-sm">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(lesson.content) }}
                />
              </div>
            )}
            {/* Quick Check quiz below simulation lessons */}
            {HVAC_QUICK_CHECKS[lessonId] && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-brand-blue-600" />
                  Quick Check — Test Your Understanding
                </h3>
                <QuizPlayer
                  questions={HVAC_QUICK_CHECKS[lessonId]}
                  title="Quick Check"
                  passingScore={60}
                  onComplete={(score) => {
                  }}
                />
              </div>
            )}
          </div>
        ) : lesson.video_url && !lesson.video_url.includes('/generated/lessons/') ? (
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            {/* Video/audio lesson with real media file */}
            <InteractiveVideoPlayer
              videoUrl={lesson.video_url}
              title={lesson.title}
              onComplete={() => {
                if (!isCompleted) {
                  setIsCompleted(true);
                  markComplete();
                }
              }}
            />
            {/* Show lesson content below video */}
            {lesson.content && (
              <div className="mt-6 bg-white rounded-xl p-8 shadow-sm">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(lesson.content) }}
                />
              </div>
            )}
            {/* Quick Check quiz below video lessons */}
            {HVAC_QUICK_CHECKS[lessonId] && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-brand-blue-600" />
                  Quick Check — Test Your Understanding
                </h3>
                <QuizPlayer
                  questions={HVAC_QUICK_CHECKS[lessonId]}
                  title="Quick Check"
                  passingScore={60}
                  onComplete={(score) => {
                    // Quick checks don't block progress — just reinforcement
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          /* Reading / text / video-without-file lesson — show rich content */
          <div className="bg-white py-8">
            <div className="max-w-4xl mx-auto px-4">
              <div className="bg-white rounded-xl p-8 shadow-sm">
                {lesson.content ? (
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(lesson.content) }}
                  />
                ) : (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                      <BookOpen className="w-4 h-4" />
                      <span>Lesson {currentIndex + 1} of {lessons.length}</span>
                    </div>
                    <p className="text-slate-600">{lesson.description || 'No content available for this lesson.'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lesson Content */}
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {/* Checkpoint gate banner — shown when previous module checkpoint not passed */}
          {checkpointBlocked && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
              <ClipboardList className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">Module checkpoint required</p>
                <p className="text-amber-700 text-sm mt-1">
                  {completionError && completionError.includes('≥')
                    ? completionError
                    : 'You must pass the checkpoint for the previous module before continuing. Return to that checkpoint and achieve a passing score to unlock this lesson.'}
                </p>
              </div>
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">{lesson.title}</h1>
            <button
              onClick={checkpointBlocked ? undefined : markComplete}
              disabled={checkpointBlocked}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                checkpointBlocked
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : isCompleted
                  ? 'bg-brand-green-100 text-brand-green-700 border-2 border-brand-green-600'
                  : 'bg-brand-green-600 hover:bg-brand-green-700 text-white'
              }`}
            >
              {checkpointBlocked ? 'Locked — complete checkpoint first' : isCompleted ? '• Completed' : 'Mark as Complete'}
            </button>
          </div>
          {completionError && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              {completionError}
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-slate-200 mb-6">
            <div className="flex gap-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 px-1 font-semibold whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-brand-blue-600 text-brand-blue-600'
                    : 'text-black hover:text-black'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`pb-3 px-1 font-semibold whitespace-nowrap ${
                  activeTab === 'resources'
                    ? 'border-b-2 border-brand-blue-600 text-brand-blue-600'
                    : 'text-black hover:text-black'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Resources
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`pb-3 px-1 font-semibold whitespace-nowrap ${
                  activeTab === 'notes'
                    ? 'border-b-2 border-brand-blue-600 text-brand-blue-600'
                    : 'text-black hover:text-black'
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Notes
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mb-8">
            {activeTab === 'overview' && (
              <div className="prose max-w-none">
                <p className="text-black text-lg leading-relaxed">
                  {lesson.description}
                </p>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="space-y-3">
                {lesson.resources.map((resource: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-white rounded-lg hover:bg-white transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-brand-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold">{resource.name}</div>
                        <div className="text-sm text-slate-500">
                          {resource.size}
                        </div>
                      </div>
                    </div>
                    <a
                      href={resource.url}
                      download
                      className="flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <textarea
                  placeholder="Take notes while you learn..."
                  className="w-full h-64 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
                <button className="mt-3 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-2 rounded-lg font-semibold" aria-label="Action button">
                  Save Notes
                </button>
              </div>
            )}
          </div>

          {/* Course Completion Banner */}
          {courseCompleted && (
            <div className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-green-100 rounded-full flex items-center justify-center">
                  <span className="w-4 h-4 rounded-full bg-brand-green-500 inline-block" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-brand-green-900">Course Completed!</h3>
                  <p className="text-brand-green-700 text-sm">
                    Congratulations! You have completed all lessons in this course.
                  </p>
                </div>
                {certificate && (
                  <Link
                    href={`/certificates/${certificate.id}`}
                    className="bg-brand-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-brand-green-700 transition text-sm"
                  >
                    View Certificate
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-8 border-t border-slate-200">
            <button
              onClick={goToPrevious}
              disabled={!hasPrevious}
              aria-label="Previous Lesson"
              className={`flex items-center gap-2 px-3 sm:px-6 py-3 rounded-lg text-sm sm:text-base font-semibold transition ${
                hasPrevious
                  ? 'bg-white hover:bg-slate-200 text-black'
                  : 'bg-white text-slate-400 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Previous Lesson</span>
            </button>
            <button
              onClick={goToNext}
              disabled={!hasNext}
              aria-label="Next Lesson"
              className={`flex items-center gap-2 px-3 sm:px-6 py-3 rounded-lg text-sm sm:text-base font-semibold transition ${
                hasNext
                  ? 'bg-brand-blue-600 hover:bg-brand-blue-700 text-white'
                  : 'bg-white text-slate-400 cursor-not-allowed'
              }`}
            >
              <span className="hidden sm:inline">Next Lesson</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Note Taking */}
          <div className="mt-8">
            <NoteTaking courseId={courseId} lessonId={lessonId} />
          </div>

          {/* Digital Binder */}
          <div className="mt-8">
            <DigitalBinder />
          </div>
        </div>
      </div>
    </div>
  );
}
