'use client';

import { useState } from 'react';
import LessonAssessmentEditor, {
  type EditableQuizQuestion,
} from '@/components/admin/lesson-editor/LessonAssessmentEditor';
import { useCourse } from '../CourseProvider';
import { courseBuilderJsonHeaders } from '@/components/admin/course-builder/request';

function editableQuestions(value: unknown): EditableQuizQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.map((question, index) => {
    const row = question && typeof question === 'object'
      ? question as Record<string, unknown>
      : {};
    const options = Array.isArray(row.options)
      ? row.options.map((option) => String(option))
      : [];
    const rawAnswer = Array.isArray(row.correctAnswer)
      ? row.correctAnswer[0]
      : row.correctAnswer;
    const correctAnswer = typeof rawAnswer === 'number'
      ? options[rawAnswer] ?? ''
      : typeof rawAnswer === 'boolean'
        ? rawAnswer ? 'True' : 'False'
        : String(rawAnswer ?? '');
    const type = row.type === 'true_false' || row.questionType === 'true_false'
      ? 'true_false'
      : 'multiple_choice';

    return {
      id: String(row.id ?? `question-${index + 1}`),
      prompt: String(row.prompt ?? row.question ?? ''),
      type,
      options: type === 'true_false' ? ['True', 'False'] : options,
      correctAnswer,
      explanation: String(row.explanation ?? ''),
      domainKey: typeof row.domainKey === 'string' ? row.domainKey : undefined,
      competencyKeys: Array.isArray(row.competencyKeys)
        ? row.competencyKeys.map((key) => String(key))
        : undefined,
    };
  });
}

export function AssessmentsPanel() {
  const { state, upsertLesson } = useCourse();
  const [runningId, setRunningId] = useState('');
  const [savingId, setSavingId] = useState('');
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const assessments = state.lessons.filter((lesson) =>
    ['quiz', 'checkpoint', 'exam', 'final_exam', 'assessment'].includes(lesson.lesson_type),
  );

  async function hydrate(lesson: (typeof state.lessons)[number]) {
    const existing = editableQuestions(lesson.quiz_questions);
    if (existing.length && !window.confirm(`Replace all ${existing.length} existing questions with newly generated questions?`)) {
      return;
    }
    setRunningId(lesson.id);
    setError('');
    setNotice('');
    try {
      const courseModule = state.modules.find((item) => item.id === lesson.module_id);
      const response = await fetch('/api/admin/course-builder/hydrate', {
        method: 'POST',
        headers: courseBuilderJsonHeaders('assessment'),
        body: JSON.stringify({
          lessonId: lesson.id,
          lessonType: ['exam', 'final_exam'].includes(lesson.lesson_type) ? 'exam' : 'checkpoint',
          moduleTitle: courseModule?.title ?? 'Course',
          courseTitle: state.course.title,
          domainKey: lesson.domain_key ?? courseModule?.domain_key ?? undefined,
          passingScore: lesson.passing_score ?? 70,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? payload.errors?.join('; ') ?? 'Assessment generation failed.');
      upsertLesson({
        ...lesson,
        quiz_questions: payload.questions ?? [],
        passing_score: payload.passingScore ?? lesson.passing_score ?? 70,
      });
      setEditingId(lesson.id);
      setNotice(`${payload.questionCount ?? payload.questions?.length ?? 0} questions generated and saved.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Assessment generation failed.');
    } finally {
      setRunningId('');
    }
  }

  async function save(lesson: (typeof state.lessons)[number]) {
    setSavingId(lesson.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/course-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-assessment',
          lessonId: lesson.id,
          passingScore: lesson.passing_score ?? 70,
          questions: editableQuestions(lesson.quiz_questions),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok === false) throw new Error(payload.error ?? 'Assessment save failed.');
      upsertLesson({
        ...lesson,
        quiz_questions: payload.questions,
        passing_score: payload.passingScore,
      });
      setNotice(`${payload.writtenToDb} questions saved atomically.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Assessment save failed.');
    } finally {
      setSavingId('');
    }
  }

  return (
    <section className="p-6">
      <h2 className="text-xl font-bold text-slate-950">Assessment studio</h2>
      <p className="mt-1 text-sm text-slate-600">
        Write questions directly or generate them with AI. Publication uses the automated quality gate; no human course-content approval is required.
      </p>
      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
      <div className="mt-4 space-y-3">
        {assessments.length ? (
          assessments.map((lesson) => {
            const questions = editableQuestions(lesson.quiz_questions);
            const editing = editingId === lesson.id;
            return (
              <div key={lesson.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{lesson.title}</div>
                    <div className="text-xs text-slate-500">
                      {lesson.lesson_type} · {questions.length} questions · pass {lesson.passing_score ?? 70}%
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(editing ? '' : lesson.id)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      {editing ? 'Close editor' : 'Edit questions'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void hydrate(lesson)}
                      disabled={runningId === lesson.id || savingId === lesson.id}
                      className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {runningId === lesson.id ? 'Generating…' : questions.length ? 'Regenerate with AI' : 'Generate with AI'}
                    </button>
                  </div>
                </div>

                {editing ? (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <LessonAssessmentEditor
                      questions={questions}
                      passingScore={lesson.passing_score ?? 70}
                      onChange={(next) => upsertLesson({ ...lesson, quiz_questions: next })}
                      onScoreChange={(passingScore) => upsertLesson({ ...lesson, passing_score: passingScore })}
                    />
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => void save(lesson)}
                        disabled={savingId === lesson.id || runningId === lesson.id || questions.length === 0}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        {savingId === lesson.id ? 'Saving…' : 'Save assessment'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500">No assessment lessons found.</p>
        )}
      </div>
    </section>
  );
}
