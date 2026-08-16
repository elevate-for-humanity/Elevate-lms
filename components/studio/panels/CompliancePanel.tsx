'use client';

import { useCourse } from '../CourseProvider';

export function CompliancePanel() {
  const { state } = useCourse();
  const lessonMinutes = state.lessons.reduce((sum, lesson) => sum + Number(lesson.duration_minutes ?? 0), 0);
  const targetHours = state.modules.reduce((sum, module) => sum + Number(module.target_hours ?? 0), 0);
  const signoffs = state.lessons.filter((lesson) => lesson.requires_instructor_signoff).length;
  const missingObjectives = state.lessons.filter((lesson) => !Array.isArray(lesson.learning_objectives) || lesson.learning_objectives.length === 0).length;
  const unapproved = state.lessons.filter((lesson) => !lesson.approved).length;
  const cards = [
    ['Course declared hours', String(state.course.duration_hours ?? '—')],
    ['Lesson seat hours', (lessonMinutes / 60).toFixed(2)],
    ['Module target hours', targetHours.toFixed(2)],
    ['Instructor sign-offs', String(signoffs)],
    ['Missing objectives', String(missingObjectives)],
    ['Lessons awaiting approval', String(unapproved)],
  ];

  return (
    <section className="p-6">
      <h2 className="text-xl font-bold text-slate-950">Compliance and completion readiness</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase tracking-wide text-slate-500">{label}</div><div className="mt-1 text-2xl font-black text-slate-950">{value}</div></div>)}
      </div>
      <p className="mt-5 text-sm text-slate-600">Publishing remains governed by the same loaded course session, including hours, objectives, approvals, required assessments and instructor sign-offs.</p>
    </section>
  );
}
