'use client';

import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, ShieldCheck } from 'lucide-react';
import TimedPracticeExam, { type ExamQuestion } from '@/components/lms/TimedPracticeExam';

export type ElevatePracticeSection = {
  key: string;
  label: string;
  focus: string;
  questions: ExamQuestion[];
  timeMinutes?: number;
  passingScore?: number;
};

export type ElevateUniversalPractice = {
  label: string;
  description: string;
  render: () => React.ReactNode;
};

export default function ElevatePracticeCenter({
  courseId,
  title,
  description,
  sections,
  universal,
}: {
  courseId: string;
  title: string;
  description: string;
  sections: ElevatePracticeSection[];
  universal?: ElevateUniversalPractice;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState('');
  const section = useMemo(() => sections.find((item) => item.key === selected), [sections, selected]);

  async function saveAttempt(item: ElevatePracticeSection, score: number, missed: ExamQuestion[]) {
    setSaveMessage('Saving your attempt…');
    const totalQuestions = Math.min(25, item.questions.length);
    const response = await fetch(`/api/courses/${courseId}/practice-attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sectionKey: item.key,
        totalQuestions,
        correctAnswers: totalQuestions - missed.length,
        domainScores: { [item.key]: score },
      }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setSaveMessage(body.error === 'PRACTICE_ATTEMPT_LIMIT'
        ? 'Six attempts are already recorded for this section. Ask your instructor to review your readiness.'
        : 'Your result could not be saved. Keep this page open and try again.');
      return;
    }
    setSaveMessage('Attempt saved to your learner readiness record.');
  }

  if (selected === '__universal__' && universal) {
    return <div className="space-y-5">
      <button onClick={() => setSelected(null)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50">← All practice tests</button>
      {universal.render()}
    </div>;
  }

  if (section) {
    return <div className="space-y-5">
      <button onClick={() => { setSelected(null); setSaveMessage(''); }} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50">← All practice tests</button>
      <TimedPracticeExam
        questions={section.questions}
        sectionName={section.label}
        timeMinutes={section.timeMinutes ?? 30}
        passingScore={section.passingScore ?? 70}
        storageKey={`elevate-practice:${courseId}:${section.key}:missed`}
        sourceLabel={`Elevate ${title} — ${section.label}`}
        onComplete={(score, _passed, missed) => void saveAttempt(section, score, missed)}
      />
      {saveMessage ? <p role="status" aria-live="polite" className="rounded-lg bg-slate-100 p-3 text-sm font-medium text-slate-800">{saveMessage}</p> : null}
    </div>;
  }

  return <div className="space-y-8">
    <section className="rounded-2xl bg-slate-950 p-6 text-white sm:p-8">
      <div className="flex items-center gap-3"><ShieldCheck className="h-7 w-7 text-orange-300" /><h1 className="text-2xl font-bold sm:text-3xl">{title}</h1></div>
      <p className="mt-3 max-w-3xl text-slate-200">{description}</p>
    </section>
    <div className="grid gap-4 md:grid-cols-2">
      {sections.map((item) => <button key={item.key} onClick={() => setSelected(item.key)} className="min-h-40 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-700">
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-950">{item.label}</h2><CheckCircle2 className="h-5 w-5 text-blue-700" /></div>
        <p className="mt-2 text-sm leading-6 text-slate-700">{item.focus}</p>
        <p className="mt-4 text-sm font-semibold text-blue-800">{Math.min(25, item.questions.length)} questions · {item.timeMinutes ?? 30} minutes · {item.passingScore ?? 70}% readiness target</p>
      </button>)}
    </div>
    {universal ? <button onClick={() => setSelected('__universal__')} className="w-full rounded-2xl bg-blue-800 p-6 text-left text-white shadow-sm hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2">
      <div className="flex items-center gap-3"><BookOpen className="h-6 w-6" /><h2 className="text-xl font-bold">{universal.label}</h2></div>
      <p className="mt-2 text-blue-100">{universal.description}</p>
    </button> : null}
  </div>;
}
