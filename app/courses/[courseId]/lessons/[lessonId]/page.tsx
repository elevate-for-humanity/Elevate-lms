'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  BookOpen,
  Download,
  CheckCircle,
  Play,
  ChevronDown,
  Menu,
  X,
  Lock,
  Target,
  Lightbulb,
  Wrench,
  Tag,
} from 'lucide-react';
import { QuizSystem } from '@/components/lms/QuizSystem';
import LessonPlayer from '@/components/lms/LessonPlayer';
import { sanitizeRichHtml } from '@/lib/security/sanitize-html';
import { NoteTaking } from '@/components/NoteTaking';
import DigitalBinder from '@/components/DigitalBinder';

// Lesson-to-module mapping (same as course page)
const LESSON_MODULE_MAP: Record<number, number[]> = {
  1: [1, 2, 3, 4],
  2: [5, 6, 7, 8, 9],
  3: [10, 11, 12, 13, 14],
  4: [15, 16, 17, 18, 19, 20],
  5: [21, 22, 23, 24, 25, 26],
  6: [27, 28, 29, 30, 31, 32, 33, 34],
  7: [35, 36, 37, 38, 39],
  8: [40, 41, 42, 43, 44, 45, 46],
  9: [47, 48, 49, 50, 51, 52],
  10: [53, 54, 55, 56, 57, 58, 59],
  11: [60, 61, 62, 63, 64],
  12: [65, 66, 67, 68, 69, 70],
  13: [71, 72, 73, 74, 75, 76],
  14: [77, 78, 79, 80, 81, 82, 83, 84],
  15: [85, 86, 87, 88, 89],
  16: [90, 91, 92, 93, 94, 95],
};

function getModuleForLesson(lessonNumber: number): number {
  for (const [moduleIdx, lessons] of Object.entries(LESSON_MODULE_MAP)) {
    if (lessons.includes(lessonNumber)) return parseInt(moduleIdx);
  }
  return 0;
}

interface ModuleGroup {
  id: string;
  title: string;
  order_index: number;
  description?: string;
  lessons: any[];
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [course, setCourse] = useState<any>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [videoWatchPercent, setVideoWatchPercent] = useState(0);

  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);

  const fetchLessonData = async () => {
    const apiRes = await fetch(`/api/courses/${courseId}/lessons/public`);
    const apiData = apiRes.ok ? await apiRes.json() : { course: null, lessons: [], modules: [] };

    const courseData = apiData.course;
    const lessonsData: any[] = apiData.lessons || [];
    const modulesData: any[] = apiData.modules || [];
    const lessonData = lessonsData.find((l: any) => l.id === lessonId) || null;

    if (lessonData) {
      setLesson({ ...lessonData, resources: lessonData.resources || [] });
    }
    if (lessonsData) setLessons(lessonsData);
    if (modulesData) setModules(modulesData);

    if (courseData) {
      setCourse({
        ...courseData,
        totalLessons: lessonsData?.length || 0,
      });
    }

    // Fetch user progress in background
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && lessonsData) {
        const progressRes = await fetch(`/api/lms/progress?courseId=${courseId}`);
        const progressData = progressRes.ok ? await progressRes.json() : { progress: [] };
        const allProgress = progressData.progress;
        if (allProgress) {
          const completedIds = new Set(
            allProgress.filter((p: any) => p.completed).map((p: any) => p.lesson_id)
          );
          setCompletedLessonIds(completedIds as Set<string>);
          setIsCompleted(completedIds.has(lessonId));
        }
      }
    } catch {
      // Auth/progress fetch failed — lesson still renders
    }
  };

  // Sequential unlock: a lesson is accessible if it's the first, or the previous lesson is completed
  const isLessonUnlocked = (lessonIndex: number): boolean => {
    if (lessonIndex === 0) return true;
    const prevLesson = lessons[lessonIndex - 1];
    return prevLesson ? completedLessonIds.has(prevLesson.id) : false;
  };

  // Video lessons require 90%+ watched; quiz lessons require passing; reading lessons are always completable
  const canMarkComplete = (): boolean => {
    if (isCompleted) return true;
    if (!lesson) return false;
    if (lesson.content_type === 'quiz') return false; // quiz auto-completes on pass
    if (lesson.video_url && lesson.content_type !== 'reading') return videoWatchPercent >= 90;
    return true; // reading lessons
  };

  const markComplete = async () => {
    if (isCompleted) return; // no un-completing
    if (!canMarkComplete()) return;

    setIsCompleted(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSpentSeconds: 0 }),
      });
      if (!response.ok) { setIsCompleted(false); return; }
      const result = await response.json();
      setCompletedLessonIds((prev) => new Set([...prev, lessonId]));
      if (result.courseProgress?.courseCompleted) {
        setCourseCompleted(true);
        if (result.certificate) setCertificate(result.certificate);
      }
    } catch {
      setIsCompleted(false);
    }
  };

  const currentIndex = lessons.findIndex((l) => l.id === lessonId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < lessons.length - 1;

  const goToPrevious = () => {
    if (hasPrevious) {
      router.push(`/courses/${courseId}/lessons/${lessons[currentIndex - 1].id}`);
    }
  };

  const goToNext = () => {
    if (hasNext && isCompleted) {
      router.push(`/courses/${courseId}/lessons/${lessons[currentIndex + 1].id}`);
    }
  };

  // Group lessons by module for sidebar
  const moduleGroups: ModuleGroup[] = useMemo(() => {
    if (!modules.length) return [];
    return modules.map((mod: any) => ({
      ...mod,
      lessons: lessons.filter((l: any) => getModuleForLesson(l.lesson_number) === mod.order_index),
    }));
  }, [modules, lessons]);

  // Current module
  const currentModule = useMemo(() => {
    if (!lesson) return null;
    const modIdx = getModuleForLesson(lesson.lesson_number);
    return modules.find((m: any) => m.order_index === modIdx) || null;
  }, [lesson, modules]);

  // Parse competency tags from topics field
  const competencyTags = useMemo(() => {
    if (!lesson?.topics) return [];
    const topics = Array.isArray(lesson.topics) ? lesson.topics : [];
    return topics.map((t: string) => {
      const match = t.match(/^([\d.]+)\s*\|\s*(\w+):\s*(.+?)\s*>\s*(.+)$/);
      if (match) return { code: match[1], domain: match[2], domainName: match[3], name: match[4] };
      return { code: '', domain: '', domainName: '', name: t };
    });
  }, [lesson?.topics]);

  // Parse Key Takeaways and Apply It from description
  const parsedDescription = useMemo(() => {
    if (!lesson?.description) return { base: '', takeaways: [] as string[], scenario: '' };
    const desc = lesson.description;
    const tkIdx = desc.indexOf('Key Takeaways:');
    const aiIdx = desc.indexOf('Apply It:');
    const base = tkIdx >= 0 ? desc.substring(0, tkIdx).trim() : desc;
    let takeaways: string[] = [];
    let scenario = '';
    if (tkIdx >= 0 && aiIdx >= 0) {
      const tkText = desc.substring(tkIdx + 14, aiIdx).trim();
      takeaways = tkText.split(' | ').map((t: string) => t.trim()).filter(Boolean);
    }
    if (aiIdx >= 0) {
      scenario = desc.substring(aiIdx + 9).trim();
    }
    return { base, takeaways, scenario };
  }, [lesson?.description]);

  // Derive caption URL from lesson number (captions exist for L01-L04)
  const captionUrl = useMemo(() => {
    if (!lesson?.lesson_number) return null;
    const ln = lesson.lesson_number;
    if (ln >= 1 && ln <= 4) {
      const num = String(ln).padStart(3, '0');
      return `https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-videos/captions/hvac-lesson-${num}.vtt`;
    }
    return null;
  }, [lesson?.lesson_number]);

  // Loading / timeout
  const [loadTimeout, setLoadTimeout] = useState(false);
  useEffect(() => {
    if (lesson) { setLoadTimeout(false); return; }
    const timer = setTimeout(() => setLoadTimeout(true), 30000);
    return () => clearTimeout(timer);
  }, [lesson]);

  if (!lesson) {
    if (loadTimeout) {
      return (
        <div className="flex items-center justify-center h-[100dvh] bg-slate-50">
          <div className="text-center max-w-md px-4">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Lesson Not Found</h2>
            <p className="text-slate-600 mb-6">
              This lesson could not be loaded. It may have been removed or you may not have access.
            </p>
            <Link
              href={`/courses/${courseId}`}
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
        <aside className="hidden lg:block w-80 bg-white border-r p-4">
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
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-brand-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading lesson...</p>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = lessons.length > 0 ? Math.round((completedLessonIds.size / lessons.length) * 100) : 0;

  return (
    <div className="flex h-[100dvh] bg-slate-50">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 bg-white p-2.5 rounded-xl shadow-lg border border-slate-200"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — module-grouped lesson list */}
      <aside
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 w-80 max-w-[85vw] lg:max-w-none bg-white border-r overflow-y-auto transition-transform duration-300 fixed lg:relative h-full z-40 flex flex-col`}
      >
        {/* Sidebar header */}
        <div className="p-4 sm:p-5 border-b bg-slate-50 flex-shrink-0">
          <Link
            href={`/courses/${courseId}`}
            className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold mb-3 inline-flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Course
          </Link>
          <h2 className="font-bold text-base text-slate-900 leading-tight">{course?.title}</h2>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>{completedLessonIds.size}/{lessons.length} lessons</span>
              <span className="font-bold text-brand-blue-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div
                className="bg-brand-green-500 h-1.5 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Module-grouped lessons */}
        <nav className="flex-1 overflow-y-auto p-3" aria-label="Course navigation">
          {moduleGroups.map((mod) => {
            const isCurrentModule = currentModule?.order_index === mod.order_index;
            const modCompleted = mod.lessons.length > 0 && mod.lessons.every((l: any) => completedLessonIds.has(l.id));

            return (
              <details
                key={mod.id}
                open={isCurrentModule}
                className="mb-1"
              >
                <summary className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm transition-colors ${
                  isCurrentModule ? 'bg-brand-blue-50' : 'hover:bg-slate-50'
                }`}>
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    modCompleted
                      ? 'bg-brand-green-100 text-brand-green-700'
                      : isCurrentModule
                        ? 'bg-brand-blue-100 text-brand-blue-700'
                        : 'bg-slate-100 text-slate-500'
                  }`}>
                    {modCompleted ? '✓' : mod.order_index}
                  </div>
                  <span className={`flex-1 font-semibold truncate ${
                    isCurrentModule ? 'text-brand-blue-900' : 'text-slate-700'
                  }`}>
                    {mod.title.replace(/^Week \d+:\s*/, '')}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform [details[open]>&]:rotate-180 flex-shrink-0" />
                </summary>

                <div className="ml-4 mt-1 space-y-0.5">
                  {mod.lessons.map((l: any) => {
                    const lessonDone = completedLessonIds.has(l.id) || (l.id === lessonId && isCompleted);
                    const isCurrent = l.id === lessonId;
                    const lessonIdx = lessons.findIndex((ll: any) => ll.id === l.id);
                    const unlocked = isLessonUnlocked(lessonIdx);

                    if (!unlocked && !isCurrent) {
                      // Locked lesson — not clickable
                      return (
                        <div
                          key={l.id}
                          className="flex items-center gap-2.5 p-2 rounded-lg text-sm text-slate-400 cursor-not-allowed opacity-60"
                        >
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-100">
                            <Lock className="w-2.5 h-2.5 text-slate-400" />
                          </div>
                          <span className="flex-1 truncate">{l.title}</span>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={l.id}
                        href={`/courses/${courseId}/lessons/${l.id}`}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-2.5 p-2 rounded-lg transition text-sm ${
                          isCurrent
                            ? 'bg-brand-blue-100 border-l-3 border-brand-blue-600'
                            : lessonDone
                              ? 'text-brand-green-700 hover:bg-brand-green-50'
                              : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          lessonDone
                            ? 'bg-brand-green-200'
                            : isCurrent
                              ? 'bg-brand-blue-200'
                              : 'bg-slate-100'
                        }`}>
                          {lessonDone ? (
                            <CheckCircle className="w-3 h-3 text-brand-green-600" />
                          ) : isCurrent ? (
                            <Play className="w-2.5 h-2.5 text-brand-blue-600 ml-0.5" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          )}
                        </div>
                        <span className={`flex-1 truncate ${isCurrent ? 'font-semibold text-brand-blue-900' : ''}`}>
                          {l.title}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Lesson content area */}
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
          <div className="max-w-5xl mx-auto p-3 sm:p-6 lg:p-8">
            {/* Module + lesson header */}
            <div className="mb-4">
              {currentModule && (
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue-600 mb-1">
                  {currentModule.title}
                </p>
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{lesson.title}</h1>
            </div>

            {/* Quiz video intro (if available) */}
            {lesson.video_url && (
              <div className="mb-8">
                <LessonPlayer
                  videoUrl={lesson.video_url}
                  lessonTitle={lesson.title}
                  moduleTitle={currentModule?.title}
                  lessonNumber={currentIndex + 1}
                  totalLessons={lessons.length}
                  durationMinutes={lesson.duration_minutes ?? undefined}
                  captionUrl={captionUrl}
                />
              </div>
            )}

            {/* Quiz */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Assessment</h2>
              <p className="text-sm text-slate-500 mb-6">Passing score: 80% — You must pass to continue to the next lesson.</p>
              <QuizSystem
                questions={lesson.quiz_questions || []}
                onComplete={async (score) => {
                  try {
                    await fetch(`/api/lms/quizzes/${lesson.quiz_id}/submit`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ score, answers: [] }),
                    });
                    if (score >= 80) {
                      setIsCompleted(true);
                      const response = await fetch(`/api/lessons/${lessonId}/complete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ timeSpentSeconds: 0 }),
                      });
                      if (response.ok) {
                        setCompletedLessonIds((prev) => new Set([...prev, lessonId]));
                      }
                    }
                  } catch { /* non-fatal */ }
                }}
                passingScore={80}
              />
            </div>
          </div>
        ) : lesson.video_url ? (
          <div className="max-w-5xl mx-auto p-3 sm:p-6 lg:p-8">
            {/* Module + lesson header */}
            <div className="mb-4">
              {currentModule && (
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue-600 mb-1">
                  {currentModule.title}
                </p>
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{lesson.title}</h1>
            </div>

            {/* Video player */}
            <LessonPlayer
              videoUrl={lesson.video_url}
              lessonTitle={lesson.title}
              moduleTitle={currentModule?.title}
              transcript={lesson.transcript ?? null}
              lessonContent={lesson.content ?? null}
              lessonNumber={currentIndex + 1}
              totalLessons={lessons.length}
              durationMinutes={lesson.duration_minutes ?? undefined}
              captionUrl={captionUrl}
              onProgress={(percent: number) => {
                setVideoWatchPercent(percent);
                // Auto-mark complete when 90% watched
                if (percent >= 90 && !isCompleted) {
                  markComplete();
                }
              }}
              onComplete={() => {
                setVideoWatchPercent(100);
                if (!isCompleted) markComplete();
              }}
            />
            {/* Watch progress indicator */}
            {!isCompleted && lesson.video_url && (
              <div className="mx-4 mt-2">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Watch progress</span>
                  <span className={videoWatchPercent >= 90 ? 'text-brand-green-600 font-semibold' : ''}>
                    {Math.round(videoWatchPercent)}%{videoWatchPercent >= 90 ? ' — Complete!' : ' — Watch 90% to continue'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${videoWatchPercent >= 90 ? 'bg-brand-green-500' : 'bg-brand-blue-500'}`}
                    style={{ width: `${Math.min(videoWatchPercent, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Reading / text lesson */
          <div className="max-w-4xl mx-auto p-4 sm:p-8">
            {currentModule && (
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue-600 mb-1">
                {currentModule.title}
              </p>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">{lesson.title}</h1>
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-slate-200">
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
        )}

        {/* Below-video content area */}
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 pb-8">
          {/* Mark complete + nav */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3 pt-4 border-t border-slate-200">
            {lesson.content_type === 'quiz' ? (
              <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm ${
                isCompleted
                  ? 'bg-brand-green-50 text-brand-green-700 border-2 border-brand-green-300'
                  : 'bg-amber-50 text-amber-700 border-2 border-amber-200'
              }`}>
                <CheckCircle className="w-4 h-4" />
                {isCompleted ? 'Quiz Passed' : 'Pass quiz with 80% to continue'}
              </div>
            ) : lesson.content_type === 'reading' ? (
              <button
                onClick={markComplete}
                disabled={isCompleted}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition ${
                  isCompleted
                    ? 'bg-brand-green-50 text-brand-green-700 border-2 border-brand-green-300'
                    : 'bg-brand-green-600 hover:bg-brand-green-700 text-white'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                {isCompleted ? 'Completed' : 'Mark as Complete'}
              </button>
            ) : (
              <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm ${
                isCompleted
                  ? 'bg-brand-green-50 text-brand-green-700 border-2 border-brand-green-300'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                <CheckCircle className="w-4 h-4" />
                {isCompleted ? 'Completed' : 'Watch 90% of the video to complete'}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={goToPrevious}
                disabled={!hasPrevious}
                aria-label="Previous Lesson"
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                  hasPrevious
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>
              <button
                onClick={goToNext}
                disabled={!hasNext || !isCompleted}
                aria-label="Next Lesson"
                title={!isCompleted ? 'Complete this lesson to continue' : ''}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                  hasNext && isCompleted
                    ? 'bg-brand-blue-600 hover:bg-brand-blue-700 text-white'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {!isCompleted && hasNext && <Lock className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Competency Tags */}
          {competencyTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {competencyTags.map((tag: any, i: number) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-blue-50 text-brand-blue-700 rounded-md text-xs font-medium"
                >
                  <Tag className="w-3 h-3" />
                  {tag.code && <span className="font-mono">{tag.code}</span>}
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Lesson Description */}
          {parsedDescription.base && (
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">{parsedDescription.base}</p>
          )}

          {/* Tabs: Content / Resources / Notes / Practice */}
          <div className="border-b border-slate-200 mb-6">
            <div className="flex gap-1 overflow-x-auto">
              {[
                { key: 'content', label: 'Overview', icon: BookOpen },
                { key: 'practice', label: 'Practice', icon: Target },
                { key: 'resources', label: 'Resources', icon: FileText },
                { key: 'notes', label: 'Notes', icon: FileText },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 pb-3 px-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                    activeTab === key
                      ? 'border-b-2 border-brand-blue-600 text-brand-blue-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          {activeTab === 'content' && lesson.content && (
            <div className="bg-white rounded-xl p-5 sm:p-8 shadow-sm border border-slate-200">
              <div
                className="prose max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900"
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(lesson.content) }}
              />
            </div>
          )}

          {activeTab === 'practice' && (
            <div className="space-y-6">
              {/* Key Takeaways */}
              {parsedDescription.takeaways.length > 0 && (
                <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-slate-200">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Key Takeaways
                  </h3>
                  <ul className="space-y-2">
                    {parsedDescription.takeaways.map((t: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-brand-green-500 mt-0.5 flex-shrink-0" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Apply It Scenario */}
              {parsedDescription.scenario && (
                <div className="bg-amber-50 rounded-xl p-5 sm:p-6 border border-amber-200">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-3">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    Apply It — Field Scenario
                  </h3>
                  <p className="text-sm text-amber-800 leading-relaxed">{parsedDescription.scenario}</p>
                  <p className="text-xs text-amber-600 mt-3 italic">
                    Think through your answer before moving on. In the field, this is the kind of situation you will face.
                  </p>
                </div>
              )}

              {/* Competency Alignment */}
              {competencyTags.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-5 sm:p-6 border border-slate-200">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
                    <Target className="w-4 h-4 text-brand-blue-600" />
                    Competency Alignment
                  </h3>
                  <div className="space-y-2">
                    {competencyTags.map((tag: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border text-slate-600 mt-0.5">{tag.code}</span>
                        <div>
                          <p className="text-slate-800">{tag.name}</p>
                          {tag.domainName && <p className="text-xs text-slate-500">{tag.domainName}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsedDescription.takeaways.length === 0 && !parsedDescription.scenario && competencyTags.length === 0 && (
                <p className="text-slate-500 text-sm py-4">No practice content available for this lesson.</p>
              )}
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-3">
              {lesson.resources && lesson.resources.length > 0 ? (
                lesson.resources.map((resource: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-brand-blue-200 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-brand-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-900">{resource.name}</div>
                        {resource.size && <div className="text-xs text-slate-500">{resource.size}</div>}
                      </div>
                    </div>
                    <a
                      href={resource.url}
                      download
                      className="flex items-center gap-1.5 text-brand-blue-600 hover:text-brand-blue-700 font-semibold text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm py-4">No resources available for this lesson.</p>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <NoteTaking courseId={courseId} lessonId={lessonId} />
          )}

          {/* Course Completion Banner */}
          {courseCompleted && (
            <div className="bg-brand-green-50 border-2 border-brand-green-200 rounded-xl p-6 mt-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-brand-green-600" />
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
                    className="bg-brand-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-brand-green-700 transition text-sm flex-shrink-0"
                  >
                    View Certificate
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Digital Binder */}
          <div className="mt-8">
            <DigitalBinder />
          </div>
        </div>
      </div>
    </div>
  );
}
