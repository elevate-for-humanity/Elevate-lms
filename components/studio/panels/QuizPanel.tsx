'use client';

import { HelpCircle, ShieldCheck } from 'lucide-react';
import { useCourse } from '../CourseProvider';
import { PanelHeader } from './BlueprintPanel';

export function QuizPanel() {
  const { state, setPanel } = useCourse();
  const assessments = state.lessons.filter(
    (lesson) => Array.isArray(lesson.quiz_questions) && lesson.quiz_questions.length > 0,
  );
  const questionCount = assessments.reduce(
    (total, lesson) => total + (lesson.quiz_questions?.length ?? 0),
    0,
  );

  return (
    <div className="p-6">
      <PanelHeader
        icon={<HelpCircle className="h-5 w-5" />}
        title="Quizzes & Assessments"
        subtitle={`${assessments.length} canonical assessment${assessments.length === 1 ? '' : 's'} · ${questionCount} questions`}
      />

      <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        <div className="flex items-center gap-2 font-bold"><ShieldCheck className="h-5 w-5" />One assessment authority</div>
        <p className="mt-1 leading-6">Course Builder assessments are stored on their canonical lesson records. Generate, refresh, and review those questions in Assessment Studio; this page no longer writes to the legacy standalone quiz table.</p>
        <button type="button" onClick={() => setPanel('assessments')} className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800">Open Assessment Studio</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {assessments.map((lesson) => (
          <article key={lesson.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-slate-900">{lesson.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{lesson.lesson_type.replaceAll('_', ' ')} · pass {lesson.passing_score ?? 70}%</p>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-center text-xs text-slate-600">
              <strong className="block text-2xl text-slate-950">{lesson.quiz_questions?.length ?? 0}</strong>
              persisted questions
            </div>
          </article>
        ))}
        {!assessments.length ? (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No persisted lesson assessments were found. Open Assessment Studio to generate the required checkpoints.</div>
        ) : null}
      </div>
    </div>
  );
}
