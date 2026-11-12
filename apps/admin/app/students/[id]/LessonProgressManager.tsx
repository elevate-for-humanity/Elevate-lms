'use client';

import { useState, useTransition } from 'react';
import { CheckCircle, Circle, ListChecks } from 'lucide-react';
import { setLearnerLessonCompletion } from './progress-actions';

export type ManagedCourse = {
  id: string;
  title: string;
  lessons: { id: string; title: string; completed: boolean }[];
};

export function LessonProgressManager({
  studentId,
  courses,
}: {
  studentId: string;
  courses: ManagedCourse[];
}) {
  const [state, setState] = useState(courses);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function toggle(courseId: string, lessonId: string, completed: boolean, title: string) {
    const verb = completed ? 'complete' : 'not complete';
    if (
      !window.confirm(
        `Mark "${title}" as ${verb} for this learner? This is recorded in the audit log.`,
      )
    )
      return;
    startTransition(async () => {
      const result = await setLearnerLessonCompletion(studentId, lessonId, completed);
      if ('error' in result) {
        setMessage(result.error);
        return;
      }
      setMessage(`"${title}" marked ${verb}.`);
      setState((current) =>
        current.map((course) =>
          course.id !== courseId
            ? course
            : {
                ...course,
                lessons: course.lessons.map((lesson) =>
                  lesson.id === lessonId ? { ...lesson, completed } : lesson,
                ),
              },
        ),
      );
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="flex items-center gap-2 font-black text-slate-950">
          <ListChecks className="h-4 w-4" />
          Lesson progress
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Viewing the learner portal never changes progress. Changes made here are deliberate admin
          overrides and are saved to the audit log under your name.
        </p>
        {message && (
          <p role="status" className="mt-2 text-sm font-bold text-brand-blue-700">
            {message}
          </p>
        )}
      </div>
      {state.map((course) => {
        const done = course.lessons.filter((lesson) => lesson.completed).length;
        return (
          <details key={course.id} className="border-b border-slate-100 last:border-b-0">
            <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-5 py-4 font-bold text-slate-900">
              <span className="min-w-0 flex-1">{course.title}</span>
              <span className="text-xs text-slate-500">
                {done} of {course.lessons.length} lessons complete
              </span>
            </summary>
            <ul className="divide-y divide-slate-100">
              {course.lessons.map((lesson) => (
                <li key={lesson.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  {lesson.completed ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-slate-300" />
                  )}
                  <span className="min-w-0 flex-1 text-sm text-slate-800">{lesson.title}</span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => toggle(course.id, lesson.id, !lesson.completed, lesson.title)}
                    className="min-h-11 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50"
                  >
                    {lesson.completed ? 'Mark not complete' : 'Mark complete'}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </section>
  );
}
