
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
import LessonPlayer from '@/components/lms/LessonPlayer';
import { sanitizeRichHtml } from '@/lib/security/sanitize-html';
import { NoteTaking } from '@/components/NoteTaking';
import DigitalBinder from '@/components/DigitalBinder';

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

  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);

  const fetchLessonData = async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    // 1. Fetch lesson data first
    const { data: lessonData } = await supabase
      .from('training_lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    const { data: lessonsData } = await supabase
      .from('training_lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');

    const { data: courseData } = await supabase
      .from('training_courses')
      .select('*')
      .eq('id', courseId)
      .single();

    // 2. Set state IMMEDIATELY so the UI renders
    if (lessonData) {
      setLesson({
        ...lessonData,
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

    // 3. Fetch user progress in background (don't block lesson render)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
  };

  const markComplete = async () => {
    const newStatus = !isCompleted;
    setIsCompleted(newStatus);

    try {
      if (newStatus) {
        const response = await fetch(`/api/lessons/${lessonId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timeSpentSeconds: 0 }),
        });

        if (!response.ok) {
          setIsCompleted(false);
          return;
        }

        const result = await response.json();

        // Update sidebar completion state
        setCompletedLessonIds((prev) => new Set([...prev, lessonId]));

        // Handle course completion + certificate
        if (result.courseProgress?.courseCompleted) {
          setCourseCompleted(true);
          if (result.certificate) {
            setCertificate(result.certificate);
          }
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

  if (!lesson) {
    if (loadTimeout) {
      return (
        <div className="flex items-center justify-center h-[100dvh] bg-slate-50">
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
      <div className="flex h-[100dvh] bg-slate-50">
        {/* Skeleton sidebar */}
        <aside className="hidden md:block w-80 bg-white border-r p-4">
          <div className="h-5 bg-slate-200 rounded w-3/4 mb-4 animate-pulse" />
          <div className="h-2 bg-slate-100 rounded-full mb-6 animate-pulse" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-1 animate-pulse" />
                <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse" />
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
    <div className="flex h-[100dvh] bg-slate-50">
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
          {lessons.map((l, idx) => {
            const lessonDone = completedLessonIds.has(l.id) || (l.id === lessonId && isCompleted);
            // Sequential lock: lesson is accessible only if it's the first, or the previous lesson is done
            const previousDone = idx === 0 || completedLessonIds.has(lessons[idx - 1]?.id);
            const isLocked = !lessonDone && !previousDone && l.id !== lessonId;
            const isCurrent = l.id === lessonId;

            if (isLocked) {
              return (
                <div
                  key={l.id}
                  className="flex items-center gap-3 p-3 rounded-lg mb-2 opacity-40 cursor-not-allowed"
                  title="Complete the previous lesson first"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-100 text-slate-400">
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
                className={`flex items-center gap-3 p-3 rounded-lg mb-2 transition ${
                  isCurrent
                    ? 'bg-brand-blue-50 border-l-4 border-brand-blue-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    lessonDone
                      ? 'bg-brand-green-100 text-brand-green-600'
                      : isCurrent
                        ? 'bg-brand-blue-100 text-brand-blue-600'
                        : 'bg-slate-100 text-black'
                  }`}
                >
                  {lessonDone ? (
                    <span className="w-3 h-3 rounded-full bg-brand-green-500 inline-block" />
                  ) : (
                    <span className="text-sm font-bold">{idx + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-semibold text-sm truncate ${isCurrent ? 'text-brand-blue-900' : lessonDone ? 'text-brand-green-800' : 'text-black'}`}
                  >
                    {l.title}
                  </div>
                  <div className="text-xs text-slate-500">
                    {lessonDone ? 'Completed' : l.duration}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Content area — switches on lesson.content_type */}
        {lesson.content_type === 'scorm' && lesson.scorm_package_id ? (
          <div className="h-[70vh]">
            <iframe
              src={`/api/scorm/content/${lesson.scorm_package_id}/${lesson.scorm_launch_path || 'index.html'}`}
              className="w-full h-full border-0"
              title={lesson.title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          </div>
        ) : lesson.content_type === 'quiz' && lesson.quiz_id ? (
          <div className="max-w-4xl mx-auto p-8">
            <QuizSystem
              questions={lesson.quiz_questions || []}
              onComplete={async (score) => {
                // Save quiz attempt
                try {
                  await fetch(`/api/lms/quizzes/${lesson.quiz_id}/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ score, answers: [] }),
                  });
                  if (score >= (lesson.passing_score || 70)) {
                    markComplete();
                  }
                } catch { /* non-fatal */ }
              }}
              passingScore={lesson.passing_score || 70}
            />
          </div>
        ) : lesson.video_url ? (
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            <LessonPlayer
              videoUrl={lesson.video_url}
              lessonTitle={lesson.title}
              moduleTitle={course?.title}
              transcript={lesson.transcript ?? null}
              lessonContent={lesson.content ?? null}
              lessonNumber={currentIndex + 1}
              totalLessons={lessons.length}
              durationMinutes={lesson.duration_minutes ?? undefined}
              onComplete={() => {
                if (!isCompleted) {
                  setIsCompleted(true);
                  markComplete();
                }
              }}
            />
          </div>
        ) : (
          /* Reading / text lesson — no video, show content directly */
          <div className="bg-slate-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
              <div className="bg-white rounded-xl p-8 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <BookOpen className="w-4 h-4" />
                  <span>Reading &middot; Lesson {currentIndex + 1} of {lessons.length}</span>
                </div>
                {lesson.content ? (
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(lesson.content) }}
                  />
                ) : (
                  <p className="text-slate-600">{lesson.description || 'No content available for this lesson.'}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lesson Content */}
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">{lesson.title}</h1>
            <button
              onClick={markComplete}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                isCompleted
                  ? 'bg-brand-green-100 text-brand-green-700 border-2 border-brand-green-600'
                  : 'bg-brand-green-600 hover:bg-brand-green-700 text-white'
              }`}
            >
              {isCompleted ? '• Completed' : 'Mark as Complete'}
            </button>
          </div>

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
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
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
                  ? 'bg-slate-100 hover:bg-slate-200 text-black'
                  : 'bg-slate-50 text-slate-400 cursor-not-allowed'
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
                  : 'bg-slate-50 text-slate-400 cursor-not-allowed'
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
