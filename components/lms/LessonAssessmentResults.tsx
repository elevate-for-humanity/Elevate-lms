import Link from 'next/link';
import type { loadLessonAssessmentResults } from '@/lib/lms/lesson-assessment-results';

type Result = Awaited<ReturnType<typeof loadLessonAssessmentResults>>[number];
export function LessonAssessmentResults({ results }: { results: Result[] }) {
  if (!results.length) return null;
  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-xl font-bold text-slate-950">Lesson checkpoints &amp; exams</h2>
      <p className="mt-2 text-sm text-slate-600">
        These assessments are part of your course lessons. Open the lesson to complete its required
        instruction and assessment.
      </p>
      <ul className="mt-4 divide-y divide-slate-200">
        {results.map((result) => (
          <li key={result.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <Link
              href={`/lms/courses/${result.course_id}/lessons/${result.id}`}
              className="font-bold text-blue-700 underline"
            >
              {result.title}
            </Link>
            <span className="text-sm text-slate-700">
              {result.bestScore === null
                ? 'Not attempted'
                : `Best score: ${result.bestScore}% · ${result.passed ? 'Passed' : 'Review required'} · ${result.attempts} attempt(s)`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
