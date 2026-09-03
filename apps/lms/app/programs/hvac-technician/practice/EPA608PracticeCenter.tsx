'use client';

import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, ShieldCheck } from 'lucide-react';
import TimedPracticeExam, { type ExamQuestion } from '@/components/lms/TimedPracticeExam';
import UniversalPracticeExam from '@/components/lms/UniversalPracticeExam';
import { HVAC_QUIZ_BANKS } from '@/lib/courses/hvac-quiz-banks';

type SectionKey = 'core' | 'type-i' | 'type-ii' | 'type-iii';
const SECTIONS: Array<{ key: SectionKey; bank: string; label: string; focus: string }> = [
  { key: 'core', bank: 'hvac-06', label: 'Core', focus: 'Regulations, safety, refrigerants, recovery, and environmental responsibility' },
  { key: 'type-i', bank: 'hvac-07', label: 'Type I', focus: 'Small appliances containing five pounds of refrigerant or less' },
  { key: 'type-ii', bank: 'hvac-08', label: 'Type II', focus: 'High- and very-high-pressure appliances' },
  { key: 'type-iii', bank: 'hvac-09', label: 'Type III', focus: 'Low-pressure appliances and chillers' },
];

export default function EPA608PracticeCenter({ courseId }: { courseId: string }) {
  const [selected, setSelected] = useState<SectionKey | 'universal' | null>(null);
  const [saveMessage, setSaveMessage] = useState('');
  const section = SECTIONS.find((item) => item.key === selected);
  const questions = useMemo<ExamQuestion[]>(
    () => section ? (HVAC_QUIZ_BANKS[section.bank] ?? []).slice(0, 25) : [],
    [section],
  );

  async function saveAttempt(sectionKey: SectionKey, score: number, missed: ExamQuestion[]) {
    setSaveMessage('Saving your attempt…');
    const totalQuestions = questions.length;
    const response = await fetch(`/api/courses/${courseId}/practice-attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sectionKey,
        totalQuestions,
        correctAnswers: totalQuestions - missed.length,
        domainScores: { [sectionKey]: score },
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

  if (selected === 'universal') {
    return (
      <div className="space-y-5">
        <button onClick={() => setSelected(null)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50">← All practice tests</button>
        <UniversalPracticeExam />
      </div>
    );
  }

  if (section) {
    return (
      <div className="space-y-5">
        <button onClick={() => { setSelected(null); setSaveMessage(''); }} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50">← All practice tests</button>
        <TimedPracticeExam
          questions={questions}
          sectionName={section.label}
          passingScore={70}
          onComplete={(score, _passed, missed) => void saveAttempt(section.key, score, missed)}
        />
        {saveMessage ? <p role="status" aria-live="polite" className="rounded-lg bg-slate-100 p-3 text-sm font-medium text-slate-800">{saveMessage}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-slate-950 p-6 text-white sm:p-8">
        <div className="flex items-center gap-3"><ShieldCheck className="h-7 w-7 text-orange-300" /><h1 className="text-2xl font-bold sm:text-3xl">EPA Section 608 Practice Center</h1></div>
        <p className="mt-3 max-w-3xl text-slate-200">Original Elevate preparation questions aligned to Core and Types I–III. These are study tools, not official ESCO questions or the certification examination.</p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((item) => {
          const count = Math.min(25, HVAC_QUIZ_BANKS[item.bank]?.length ?? 0);
          return <button key={item.key} onClick={() => setSelected(item.key)} className="min-h-40 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-700">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-950">{item.label}</h2><CheckCircle2 className="h-5 w-5 text-blue-700" /></div>
            <p className="mt-2 text-sm leading-6 text-slate-700">{item.focus}</p>
            <p className="mt-4 text-sm font-semibold text-blue-800">{count} questions · 30 minutes · 70% readiness target</p>
          </button>;
        })}
      </div>
      <button onClick={() => setSelected('universal')} className="w-full rounded-2xl bg-blue-800 p-6 text-left text-white shadow-sm hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2">
        <div className="flex items-center gap-3"><BookOpen className="h-6 w-6" /><h2 className="text-xl font-bold">Universal Practice Simulation</h2></div>
        <p className="mt-2 text-blue-100">Core plus Types I, II, and III. Readiness requires at least 70% in every section.</p>
      </button>
    </div>
  );
}
