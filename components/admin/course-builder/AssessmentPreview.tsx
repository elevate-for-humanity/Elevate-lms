'use client';

import {useId, useState} from 'react';

function Question({question, index}: {question: any; index: number}) {
  const name = useId();
  const [answer, setAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  return <fieldset className="rounded-lg border border-slate-500 p-4">
    <legend className="px-1 font-bold">{index + 1}. {question.prompt}</legend>
    {(question.choices ?? []).map((choice: string, i: number) => <label key={i} className="mt-2 flex cursor-pointer gap-3 rounded border border-slate-600 bg-slate-900 p-3 text-white">
      <input type="radio" name={name} checked={answer === i} onChange={() => {setAnswer(i); setChecked(false);}} />
      <span>{choice}</span>
    </label>)}
    <button type="button" disabled={answer === null} onClick={() => setChecked(true)} className="mt-3 rounded bg-cyan-300 px-4 py-2 font-bold text-slate-950 disabled:opacity-50">Check practice answer</button>
    {checked && <div role="status" className="mt-3 space-y-2">
      <p className="font-bold">{answer === question.answerIndex ? 'Correct.' : 'Review this answer.'}</p>
      <p>Correct answer: {question.choices?.[question.answerIndex]}</p>
      <p>{question.explanation}</p>
      {question.remediation && <p>Review: {question.remediation}</p>}
    </div>}
  </fieldset>;
}

export default function AssessmentPreview({assessment}: {assessment: any}) {
  if (!assessment?.questions?.length) return <p>Assessment preview will appear when its checkpoint is saved.</p>;
  return <section aria-label="Lesson assessment preview" className="space-y-4">
    <h5 className="text-lg font-bold">Multiple-choice assessment</h5>
    <p>Admin practice preview. Answers here do not create learner grades.</p>
    {assessment.passingScore != null && <p>Passing score: {Number(assessment.passingScore) <= 1 ? Number(assessment.passingScore) * 100 : assessment.passingScore}%</p>}
    {assessment.questions.map((question: any, index: number) => <Question key={question.id ?? index} question={question} index={index} />)}
    {assessment.reassessment?.length > 0 && <details className="rounded border border-slate-500 p-3">
      <summary className="cursor-pointer font-bold">Retry questions and remediation</summary>
      <div className="mt-3 space-y-4">{assessment.reassessment.map((question: any, index: number) => <Question key={question.id ?? index} question={question} index={index} />)}</div>
    </details>}
  </section>;
}
