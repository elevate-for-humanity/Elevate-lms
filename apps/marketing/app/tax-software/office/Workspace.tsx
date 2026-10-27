'use client';
import { useEffect, useState } from 'react';
import { TaxSecurityVerification } from '../_components/TaxSecurityVerification';
import { practiceCases } from '@/lib/tax-software/training/practice';
type Progress = { module_id: string; completed_at: string | null; score: number; user_id?: string };
type OfficeData = {
  hasRecruitingAccess: boolean;
  candidateCount: number;
  candidates: {
    id: string;
    name: string;
    preference: string;
    credential: string;
    status: string;
    pretestScore: number | null;
    finalScore: number | null;
    finalPassed: boolean;
  }[];
  offices: { id: string; office_name: string; office_code: string; status: string }[];
  returnCount: number;
  clientCount: number;
  stages: Record<string, number>;
  generatedAt: string;
  version: string;
  staff: { user_id: string; first_name: string; last_name: string }[];
  completions: Progress[];
  progress: Progress[];
  modules: {
    id: string;
    title: string;
    content: string;
    duration_minutes: number;
    question: { prompt: string; options: string[] } | null;
  }[];
};
const button = 'rounded-xl bg-[#073ca2] px-5 py-3 font-bold text-white disabled:opacity-50';
export function Workspace() {
  const [data, setData] = useState<OfficeData | null>(null),
    [error, setError] = useState(''),
    [office, setOffice] = useState(''),
    [revision, setRevision] = useState(0),
    [tab, setTab] = useState('reports'),
    [answers, setAnswers] = useState<Record<string, number>>({}),
    [feedback, setFeedback] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState('');
  useEffect(() => {
    let active = true;
    setError('');
    void (async () => {
      try {
        const r = await fetch(
          '/api/tax/office' + (office ? '?office=' + encodeURIComponent(office) : ''),
          { cache: 'no-store' },
        );
        const result = await r.json();
        if (!r.ok) throw Error(result.error || 'OFFICE_UNAVAILABLE');
        if (active) setData(result);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'OFFICE_UNAVAILABLE');
      }
    })();
    return () => {
      active = false;
    };
  }, [office, revision]);
  async function submit(id: string) {
    setBusy(id);
    try {
      const r = await fetch('/api/tax/office', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: id, answers: [answers[id]] }),
      });
      const result = await r.json();
      if (!r.ok) throw Error('Assessment could not be saved. Retry.');
      setFeedback((f) => ({
        ...f,
        [id]: result.passed ? '100% — knowledge check passed.' : 'Review the lesson and try again.',
      }));
      setRevision((v) => v + 1);
    } catch (e) {
      setFeedback((f) => ({ ...f, [id]: e instanceof Error ? e.message : 'Unable to save' }));
    } finally {
      setBusy('');
    }
  }
  if (error === 'MFA_REQUIRED')
    return <TaxSecurityVerification onVerified={() => setRevision((v) => v + 1)} />;
  if (error)
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6" role="alert">
        <h2 className="text-xl font-bold">
          {error === 'SIGN_IN_REQUIRED'
            ? 'Sign in to your office'
            : error === 'OFFICE_ACCESS_REQUIRED'
              ? 'Office assignment required'
              : 'Workspace temporarily unavailable'}
        </h2>
        <p className="mt-3">
          Use your assigned Supersonic account. Ask the office owner to verify access if needed.
        </p>
        <a className="mt-4 inline-block font-bold underline" href="/tax-software/login">
          Sign in
        </a>
        <button className="ml-5 underline" onClick={() => setRevision((v) => v + 1)}>
          Retry
        </button>
      </div>
    );
  if (!data) return <p role="status">Loading your private workspace…</p>;
  return (
    <div className="space-y-8">
      <nav className="flex flex-wrap gap-3 print:hidden" aria-label="Office sections">
        {[
          ['reports', 'Reports'],
          ['training', 'Staff training'],
          ['practice', 'Mock documents'],
          ...(data.hasRecruitingAccess ? [['recruiting', 'Hiring progress']] : []),
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? button : 'rounded-xl border px-5 py-3 font-bold'}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
        <a className="rounded-xl border px-5 py-3 font-bold" href="/api/tax/office?download=manual">
          Download staff manual
        </a>
      </nav>
      {tab === 'reports' && (
        <>
          <label className="block font-bold">
            Office
            <select
              className="ml-3 rounded-lg border p-3"
              value={office}
              onChange={(e) => setOffice(e.target.value)}
            >
              <option value="">All assigned offices</option>
              {data.offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.office_name} ({o.office_code})
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-slate-600">
            Tax year 2026 · Updated {new Date(data.generatedAt).toLocaleString()}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['Client records', data.clientCount],
              ['Office returns', data.returnCount],
              ['Active staff', data.staff.length],
            ].map(([label, count]) => (
              <article key={label} className="rounded-2xl border border-blue-200 p-6">
                <h2 className="text-sm font-bold text-slate-600">{label}</h2>
                <p className="mt-3 text-4xl font-black text-[#073ca2]">{count}</p>
              </article>
            ))}
          </div>
          <section>
            <h2 className="text-2xl font-bold">Preparation stages</h2>
            <p className="mt-2 text-sm text-slate-600">
              Owners see their office returns; preparers see assigned returns. These are saved
              preparation statuses, not independently verified IRS or bank results.
            </p>
            {Object.entries(data.stages).length ? (
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {Object.entries(data.stages).map(([stage, count]) => (
                  <li className="rounded-xl bg-slate-50 p-4" key={stage}>
                    {stage.replaceAll('_', ' ')}: <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-xl bg-slate-50 p-5">
                No TY2026 office returns recorded yet.
              </p>
            )}
          </section>
          <section>
            <h2 className="text-2xl font-bold">Staff learning report</h2>
            <ul className="mt-4 space-y-3">
              {data.staff.map((s) => (
                <li className="rounded-xl border p-4" key={s.user_id}>
                  {s.first_name} {s.last_name}:{' '}
                  {data.completions.filter((p) => p.user_id === s.user_id && p.completed_at).length}
                  /{data.modules.length} knowledge checks complete
                </li>
              ))}
            </ul>
            {!data.staff.length && (
              <p className="mt-3">
                No active preparers assigned yet. Your personal training is available in Staff
                training.
              </p>
            )}
          </section>
          <section className="rounded-2xl bg-amber-50 p-6">
            <h2 className="text-xl font-bold">Drake and EPS reconciliation</h2>
            <p className="mt-3 leading-7">
              Automatic provider synchronization is not enabled in these reports. Reconcile filing
              acknowledgments in Drake and funding in EPS. An exported or prepared return must not
              be counted as accepted or funded.
            </p>
          </section>
        </>
      )}
      {tab === 'training' && (
        <>
          <section className="rounded-2xl bg-[#e7efff] p-6">
            <h2 className="text-2xl font-bold">Learn your Supersonic workflow</h2>
            <p className="mt-3 leading-7">
              Preparers complete modules 1–6. Managers add module 7. Central administrators complete
              all eight. Then complete the mock-document exercises and a supervisor practical
              review. Knowledge checks are internal orientation records, not a filing credential.
            </p>
            <p className="mt-3 font-bold">
              {data.progress.filter((p) => p.completed_at).length}/{data.modules.length} knowledge
              checks complete · Version {data.version}
            </p>
          </section>
          {data.modules.map((m, i) => (
            <article key={m.id} className="rounded-2xl border border-blue-200 p-6">
              <p className="text-sm font-bold text-[#073ca2]">MODULE {i + 1}</p>
              <h2 className="mt-2 text-2xl font-bold">{m.title}</h2>
              {m.content.split('\n\n').map((section, si) => {
                const [title, ...body] = section.split('\n');
                return (
                  <section key={si} className="mt-5">
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-2 leading-7 text-slate-700">{body.join('\n')}</p>
                  </section>
                );
              })}
              {m.question && (
                <fieldset className="mt-6 rounded-xl bg-slate-50 p-4">
                  <legend className="font-bold">Knowledge check</legend>
                  <p>{m.question.prompt}</p>
                  {m.question.options.map((option, index) => (
                    <label key={option} className="mt-3 flex gap-3">
                      <input
                        type="radio"
                        name={m.id}
                        checked={answers[m.id] === index}
                        onChange={() => setAnswers((a) => ({ ...a, [m.id]: index }))}
                      />
                      {option}
                    </label>
                  ))}
                </fieldset>
              )}
              <button
                className={button + ' mt-4'}
                disabled={answers[m.id] === undefined || busy === m.id}
                onClick={() => submit(m.id)}
              >
                Submit knowledge check
              </button>
              {data.progress.some((p) => p.module_id === m.id && p.completed_at) && (
                <span className="ml-4 font-bold text-green-800">Completed</span>
              )}
              {feedback[m.id] && (
                <p role="status" className="mt-4">
                  {feedback[m.id]}
                </p>
              )}
            </article>
          ))}
        </>
      )}
      {tab === 'recruiting' && data.hasRecruitingAccess && (
        <section>
          <h2 className="text-3xl font-bold">Professional hiring pipeline</h2>
          <p className="mt-3">
            {data.candidateCount} applications · Most recent 100 shown. Scores are internal
            assessments, not hiring decisions.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {[
                    'Applicant',
                    'Preference',
                    'Credential declared',
                    'Initial test',
                    'Final test',
                    'Review',
                  ].map((h) => (
                    <th className="border-b p-3" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.candidates.map((c) => (
                  <tr key={c.id}>
                    <th className="border-b p-3" scope="row">
                      {c.name}
                    </th>
                    <td className="border-b p-3">{c.preference}</td>
                    <td className="border-b p-3">{c.credential}</td>
                    <td className="border-b p-3">
                      {c.pretestScore === null ? 'Not completed' : c.pretestScore + '%'}
                    </td>
                    <td className="border-b p-3">
                      {c.finalScore === null ? 'Not completed' : c.finalScore + '%'}
                    </td>
                    <td className="border-b p-3">
                      {c.finalPassed ? 'Supervisor/document review required' : c.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 rounded-xl bg-amber-50 p-5 leading-7">
            Verify credentials, references, practical work, screening consent/provider results and
            required HR documents before an offer and production access. A screening provider and
            secure HR document workflow still need to be connected. This report does not run
            background checks or approve employment.
          </p>
        </section>
      )}
      {tab === 'practice' && (
        <>
          <h2 className="text-3xl font-bold">Mock document practice lab</h2>
          <p className="font-bold text-red-700">
            TRAINING ONLY — FICTIONAL. Never transmit these examples.
          </p>
          <button className={button + ' print:hidden'} onClick={() => window.print()}>
            Print practice documents
          </button>
          {practiceCases.map((c) => (
            <article key={c.title} className="rounded-2xl border-2 border-dashed p-6">
              <h3 className="text-2xl font-bold">{c.title}</h3>
              <p className="mt-2 font-bold">{c.name}</p>
              {c.documents.map(([title, body]) => (
                <section key={title} className="mt-5 rounded-xl bg-slate-50 p-5">
                  <h4 className="font-bold">{title}</h4>
                  <p className="mt-2 leading-7">{body}</p>
                </section>
              ))}
              <ol className="mt-5 list-decimal space-y-2 pl-5">
                {c.tasks.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
              <details className="mt-5">
                <summary className="cursor-pointer font-bold">Review guide</summary>
                <p className="mt-2 leading-7">{c.key}</p>
              </details>
            </article>
          ))}
        </>
      )}
    </div>
  );
}
