
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

    // Fetch current lesson
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    // Fetch all lessons for this course
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');

    // Fetch course info
    const { data: courseData } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    // Fetch user progress for ALL lessons in this course
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && lessonsData) {
      const lessonIds = lessonsData.map((l: any) => l.id);
      const { data: allProgress } = await supabase
        .from('lesson_progress')
        .select('lesson_id, completed')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds);

      if (allProgress) {
        const completedIds = new Set(
          allProgress.filter((p: any) => p.completed).map((p: any) => p.lesson_id)
        );
        setCompletedLessonIds(completedIds);
        setIsCompleted(completedIds.has(lessonId));
      }
    }

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

  // Timeout: if lesson hasn't loaded after 10s, show error
  const [loadTimeout, setLoadTimeout] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!lesson) setLoadTimeout(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [lesson]);

  if (!lesson) {
    if (loadTimeout) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
          <div className="text-center max-w-md">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Lesson Not Found</h2>
            <p className="text-slate-600 mb-6">
              This lesson could not be loaded. It may have been removed or you may not have access.
            </p>
            <Link
              href={`/lms/courses/${courseId}`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700"
            >
              Back to Course
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-screen bg-slate-50">
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
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading lesson...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Lms", href: "/lms" }, { label: "[Lessonid]" }]} />
      </div>
{/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-3 rounded-lg shadow-lg"
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
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-80 bg-white border-r overflow-y-auto transition-transform duration-300 fixed md:relative h-full z-40`}
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
            return (
              <Link
                key={l.id}
                href={`/lms/courses/${courseId}/lessons/${l.id}`}
                className={`flex items-center gap-3 p-3 rounded-lg mb-2 transition ${
                  l.id === lessonId
                    ? 'bg-blue-50 border-l-4 border-brand-blue-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    lessonDone
                      ? 'bg-brand-green-100 text-brand-green-600'
                      : l.id === lessonId
                        ? 'bg-blue-100 text-brand-blue-600'
                        : 'bg-slate-100 text-black'
                  }`}
                >
                  {lessonDone ? (
                    <span className="text-slate-400 flex-shrink-0">•</span>
                  ) : (
                    <span className="text-sm font-bold">{idx + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-semibold text-sm truncate ${l.id === lessonId ? 'text-blue-900' : 'text-black'}`}
                  >
                    {l.title}
                  </div>
                  <div className="text-xs text-slate-500">{l.duration}</div>
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
                } catch {}
              }}
              passingScore={lesson.passing_score || 70}
            />
          </div>
        ) : lesson.video_url ? (
          <div className="bg-black aspect-video relative group">
            <video
              src={lesson.video_url}
              controls
              playsInline
              controlsList="nodownload"
              className="w-full h-full"
              onEnded={() => {
                if (!isCompleted) {
                  setIsCompleted(true);
                }
              }}
            />
            <div className="absolute top-4 left-4 bg-slate-900/70 text-white px-3 py-2 rounded text-sm opacity-0 group-hover:opacity-100 transition">
              Lesson {currentIndex + 1} of {lessons.length}
            </div>
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
                    dangerouslySetInnerHTML={{ __html: lesson.content }}
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
                  ? 'bg-brand-green-100 text-green-700 border-2 border-brand-green-600'
                  : 'bg-brand-green-600 hover:bg-green-700 text-white'
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
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
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
                  className="w-full h-64 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button className="mt-3 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-2 rounded-lg font-semibold" aria-label="Action button">
                  Save Notes
                </button>
              </div>
            )}
          </div>

          {/* Course Completion Banner */}
          {courseCompleted && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-900">Course Completed!</h3>
                  <p className="text-green-700 text-sm">
                    Congratulations! You have completed all lessons in this course.
                  </p>
                </div>
                {certificate && (
                  <Link
                    href={`/certificates/${certificate.id}`}
                    className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition text-sm"
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
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                hasPrevious
                  ? 'bg-slate-100 hover:bg-slate-200 text-black'
                  : 'bg-slate-50 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Previous Lesson
            </button>
            <button
              onClick={goToNext}
              disabled={!hasNext}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                hasNext
                  ? 'bg-brand-blue-600 hover:bg-brand-blue-700 text-white'
                  : 'bg-slate-50 text-slate-400 cursor-not-allowed'
              }`}
            >
              Next Lesson
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
