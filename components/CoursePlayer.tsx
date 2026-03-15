"use client";

import React from 'react';

import { useState } from "react";

export type LessonType =
  | "video"
  | "pdf"
  | "scorm"
  | "quiz"
  | "reflection"
  | "link"
  | "other";

export interface LessonViewModel {
  id: string;
  title: string;
  contentType: LessonType;
  contentUrl: string | null;
  durationMinutes: number | null;
}

interface CoursePlayerProps {
  courseTitle: string;
  lessons: LessonViewModel[];
}

/**
 * Simple client-side course player.
 * Later we can wire this to Supabase lesson_progress and JRI completions.
 */
export function CoursePlayer({ courseTitle, lessons }: CoursePlayerProps) {
  const [activeLessonId, setActiveLessonId] = useState(
    lessons[0]?.id ?? null,
  );

  const activeLesson = lessons.find((l) => l.id === activeLessonId) ?? null;

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
        <p className="text-[10px] uppercase tracking-wide text-brand-orange-400">
          Course
        </p>
        <h1 className="mt-1 text-[13px] font-semibold text-slate-900">
          {courseTitle}
        </h1>
        {activeLesson ? (
          <>
            <p className="mt-2 text-[11px] font-semibold text-slate-200">
              {activeLesson.title}
            </p>
            <div className="mt-2 rounded-lg border border-slate-800 bg-white p-2 text-[11px]">
              {activeLesson.contentType === "video" && activeLesson.contentUrl && (
                <video
                  src={activeLesson.contentUrl}
                  controls
                  className="h-52 w-full rounded-lg bg-black md:h-64"
                />
              )}
              {activeLesson.contentType === "pdf" && activeLesson.contentUrl && (
                <iframe
                  src={activeLesson.contentUrl}
                  className="h-64 w-full rounded-lg border-0 bg-white"
                  title={activeLesson.title}
                />
              )}
              {activeLesson.contentType === "scorm" && activeLesson.contentUrl && (
                <iframe
                  src={activeLesson.contentUrl}
                  className="h-64 w-full rounded-lg border-0 bg-white"
                  title={activeLesson.title}
                />
              )}
              {activeLesson.contentType === "quiz" && (
                <p className="text-slate-600">
                  Quiz content will appear here. We can wire this to live quiz
                  items stored in Supabase.
                </p>
              )}
              {activeLesson.contentType === "reflection" && (
                <p className="text-slate-600">
                  Reflection prompt: We&apos;ll store learner responses in
                  Supabase so coaches can review them.
                </p>
              )}
              {activeLesson.contentType === "link" &&
                activeLesson.contentUrl && (
                  <a
                    href={activeLesson.contentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-brand-orange-300 underline underline-offset-2"
                  >
                    Open linked resource
                  </a>
                )}
              {activeLesson.contentType === "other" && (
                <p className="text-slate-600">
                  This lesson uses a custom content type that we can define
                  later.
                </p>
              )}
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Later, this area will mark the lesson as completed and sync
              progress to the database.
            </p>
          </>
        ) : (
          <p className="mt-2 text-[11px] text-slate-600">
            No lessons found for this course yet.
          </p>
        )}
      </div>

      <aside className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-[11px]">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Lessons
        </p>
        <ul className="mt-2 space-y-1">
          {lessons.map((lesson) => {
            const isActive = lesson.id === activeLessonId;
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  onClick={() => setActiveLessonId(lesson.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left ${
                    isActive
                      ? "bg-slate-800 text-slate-50"
                      : "bg-slate-900 text-slate-200 hover:bg-slate-850"
                  }`}
                >
                  <span>{lesson.title}</span>
                  {lesson.durationMinutes && (
                    <span className="text-[10px] text-slate-500">
                      {lesson.durationMinutes} min
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
