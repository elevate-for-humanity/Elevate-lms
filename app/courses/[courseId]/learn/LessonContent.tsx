"use client";

import React from 'react';
import { sanitizeHtml } from '@/lib/sanitize';

import { useState } from 'react';
import VideoSection from './VideoSection';
import ResourceSection from './ResourceSection';

interface Lesson {
  id: string;
  title: string;
  order: number;
  duration?: number;
  completed: boolean;
  video_url?: string;
  content?: string;
}

interface LessonContentProps {
  lesson: Lesson;
  courseId: string;
  onNext?: () => void;
  onPrevious?: () => void;
}

export default function LessonContent({
  lesson,
  courseId,
  onNext,
  onPrevious,
}: LessonContentProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleMarkComplete = async () => {
    setIsCompleting(true);
    try {
      const response = await fetch(
        `/api/courses/${courseId}/lessons/${lesson.id}/complete`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        // Refresh the page to update completion status
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to mark lesson complete:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Lesson Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">
          {lesson.title}
        </h1>
        {lesson.duration && (
          <p className="text-black">
            Duration: {Math.floor(lesson.duration / 60)} minutes
          </p>
        )}
      </div>

      {/* Video Section */}
      {lesson.video_url && (
        <VideoSection
          videoUrl={lesson.video_url}
          lessonId={lesson.id}
          courseId={courseId}
        />
      )}

      {/* Lesson Content */}
      {lesson.content && (
        <div className="mt-8 prose prose-slate max-w-none">
          <div
            className="bg-white rounded-xl border border-slate-200 p-8"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.content) }}
          />
        </div>
      )}

      {/* Resources Section */}
      <ResourceSection lessonId={lesson.id} courseId={courseId} />

      {/* Action Buttons */}
      <div className="mt-8 flex items-center justify-between gap-4 p-6 bg-white rounded-xl border border-slate-200">
        <button
          onClick={onPrevious}
          disabled={!onPrevious}
          className="flex items-center gap-2 px-6 py-3 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="font-medium">Previous</span>
        </button>

        <div className="flex items-center gap-3">
          {!lesson.completed && (
            <button
              onClick={handleMarkComplete}
              disabled={isCompleting}
              className="px-6 py-3 bg-brand-green-600 text-white font-semibold rounded-lg hover:bg-brand-green-700 disabled:opacity-50 transition"
            >
              {isCompleting ? 'Marking Complete...' : 'Mark as Complete'}
            </button>
          )}
          {lesson.completed && (
            <div className="flex items-center gap-2 text-brand-green-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">Completed</span>
            </div>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={!onNext}
          className="flex items-center gap-2 px-6 py-3 bg-brand-orange-600 text-white font-semibold rounded-lg hover:bg-brand-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <span>Next Lesson</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
