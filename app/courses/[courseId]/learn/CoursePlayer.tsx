"use client";

import React, { useEffect, useCallback } from 'react';

import { useState } from 'react';
import LessonSidebar from './LessonSidebar';
import LessonContent from './LessonContent';
import { DownloadOfflineButton } from '@/components/courses/DownloadOfflineButton';

interface Lesson {
  id: string;
  title: string;
  order: number;
  duration?: number;
  completed: boolean;
  video_url?: string;
  content?: string;
}

interface CoursePlayerProps {
  courseId: string;
  courseTitle: string;
  lessons: Lesson[];
  initialLessonId?: string;
}

export default function CoursePlayer({
  courseId,
  courseTitle,
  lessons,
  initialLessonId,
}: CoursePlayerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentLessonId, setCurrentLessonId] = useState(
    initialLessonId || lessons[0]?.id
  );

  const currentLesson = lessons.find((l) => l.id === currentLessonId);
  const currentIndex = lessons.findIndex((l) => l.id === currentLessonId);
  const hasNext = currentIndex < lessons.length - 1;
  const hasPrevious = currentIndex > 0;

  const handleNextLesson = () => {
    if (hasNext) {
      setCurrentLessonId(lessons[currentIndex + 1].id);
    }
  };

  const handlePreviousLesson = () => {
    if (hasPrevious) {
      setCurrentLessonId(lessons[currentIndex - 1].id);
    }
  };

  const handleLessonSelect = (lessonId: string) => {
    setCurrentLessonId(lessonId);
  };

  const completedCount = lessons.filter((l) => l.completed).length;
  const progressPercentage = Math.round(
    (completedCount / lessons.length) * 100
  );

  // Keyboard navigation for accessibility
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return; // Don't interfere with form inputs
    }
    
    if (e.key === 'ArrowRight' && hasNext) {
      e.preventDefault();
      handleNextLesson();
    } else if (e.key === 'ArrowLeft' && hasPrevious) {
      e.preventDefault();
      handlePreviousLesson();
    }
  }, [hasNext, hasPrevious]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <LessonSidebar
        lessons={lessons}
        currentLessonId={currentLessonId}
        onLessonSelect={handleLessonSelect}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        progressPercentage={progressPercentage}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-white rounded-lg transition"
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
              <div>
                <h1 className="text-xl font-bold text-black">
                  {courseTitle}
                </h1>
                <p className="text-sm text-black">
                  Lesson {currentIndex + 1} of {lessons.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:block">
                <DownloadOfflineButton 
                  courseId={courseId} 
                  lessonUrls={lessons.map(l => `/courses/${courseId}/learn?lesson=${l.id}`)}
                />
              </div>
              <div className="hidden lg:flex items-center gap-1 text-xs text-black">
                <kbd className="px-1.5 py-0.5 bg-white rounded text-[10px] font-mono">←</kbd>
                <kbd className="px-1.5 py-0.5 bg-white rounded text-[10px] font-mono">→</kbd>
                <span>to navigate</span>
              </div>
              <div className="text-sm text-black">
                {progressPercentage}% Complete
              </div>
              <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progressPercentage} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress">
                <div
                  className="h-full bg-brand-orange-600 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="flex-1 overflow-y-auto">
          {currentLesson ? (
            <LessonContent
              lesson={currentLesson}
              courseId={courseId}
              onNext={hasNext ? handleNextLesson : undefined}
              onPrevious={hasPrevious ? handlePreviousLesson : undefined}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-black">No lesson selected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
