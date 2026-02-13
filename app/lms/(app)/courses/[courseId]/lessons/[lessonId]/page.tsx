export const dynamic = 'force-dynamic';

'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquare,
  BookOpen,
  Download,
  ClipboardList,
} from 'lucide-react';
import { LazyLMSDiscussionForum as DiscussionForum } from '@/components/LazyComponents';
import { QuizSystem } from '@/components/lms/QuizSystem';

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

    // Fetch user progress
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .single();

      if (progressData) {
        setIsCompleted(progressData.completed);
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
        // Mark as complete via API
        const response = await fetch(`/api/lessons/${lessonId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timeSpentSeconds: 0 }),
        });

        if (!response.ok) {
          setIsCompleted(false);
          console.error('Failed to mark lesson complete');
        }
      } else {
        // Mark as incomplete via API
        const response = await fetch(`/api/lessons/${lessonId}/complete`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          setIsCompleted(true);
          console.error('Failed to mark lesson incomplete');
        }
      }
    } catch (error) {
      setIsCompleted(!newStatus);
      console.error('Error updating lesson status:', error);
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

  if (!lesson)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );

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
              {course?.completedLessons} of {course?.totalLessons} lessons
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-brand-green-600 h-2 rounded-full transition-all"
                style={{
                  width: `${(course?.completedLessons / course?.totalLessons) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        <nav role="navigation" aria-label="Main navigation" className="p-4">
          {lessons.map((l, idx) => (
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
                  l.completed
                    ? 'bg-brand-green-100 text-brand-green-600'
                    : l.id === lessonId
                      ? 'bg-blue-100 text-brand-blue-600'
                      : 'bg-slate-100 text-black'
                }`}
              >
                {l.completed ? (
                  <CheckCircle className="w-5 h-5" />
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
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Video Player */}
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
          {/* Video overlay info */}
          <div className="absolute top-4 left-4 bg-slate-900/70 text-white px-3 py-2 rounded text-sm opacity-0 group-hover:opacity-100 transition">
            Lesson {currentIndex + 1} of {lessons.length}
          </div>
        </div>

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
        </div>
      </div>
    </div>
  );
}
