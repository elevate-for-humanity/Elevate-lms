'use client';

import { useState } from 'react';
import { useCourse } from '../CourseProvider';
import { courseBuilderJsonHeaders } from '@/components/admin/course-builder/request';

export function AssessmentsPanel() {
  const { state, upsertLesson } = useCourse();
  const [runningId, setRunningId] = useState('');
  const [error, setError] = useState('');
  const assessments = state.lessons.filter((lesson) =>
    ['quiz', 'checkpoint', 'exam', 'assessment'].includes(lesson.lesson_type),
  );

  async function hydrate(lesson: (typeof state.lessons)[number]) {
    setRunningId(lesson.id);
    setError('');
    try {
      const moduleTitle =
        state.modules.find((module) => module.id === lesson.module_id)?.title ?? 'Course';
      const response = await fetch('/api/admin/course-builder/hydrate', {
        method: 'POST',
        headers: courseBuilderJsonHeaders('assessment'),
        body: JSON.stringify({
          lessonId: lesson.id,
          lessonType: lesson.lesson_type === 'exam' ? 'exam' : 'checkpoint',
          moduleTitle,
          courseTitle: state.course.title,
          passingScore: lesson.passing_score ?? 70,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? 'Assessment generation failed.');
      upsertLesson({ ...lesson, quiz_questions: payload.questions ?? lesson.quiz_questions });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Assessment generation failed.');
    } finally {
      setRunningId('');
    }
  }

  return (
    <section className="p-6">
      <h2 className="text-xl font-bold text-slate-950">Assessment studio</h2>
      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-4 space-y-2">
        {assessments.length ? (
          assessments.map((lesson) => (
            <div
              key={lesson.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
            >
              <div>
                <div className="font-semibold">{lesson.title}</div>
                <div className="text-xs text-slate-500">
                  {lesson.lesson_type} · pass {lesson.passing_score ?? 70}%
                </div>
              </div>
              <button
                onClick={() => void hydrate(lesson)}
                disabled={runningId === lesson.id}
                className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {runningId === lesson.id ? 'Generating…' : 'Generate / refresh questions'}
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No assessment lessons found.</p>
        )}
      </div>
    </section>
  );
}
