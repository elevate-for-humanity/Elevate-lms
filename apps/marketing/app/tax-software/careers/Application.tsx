'use client';
import { practiceCases } from '@/lib/tax-software/training/practice';
import { useEffect, useState, type FormEvent } from 'react';
type Question = { prompt: string; options: string[] };
type Module = { id: string; title: string; content: string; question: Question | null };
type Candidate = {
  application: {
    id: string;
    status: string;
    pretest?: { score: number };
    final?: { score: number; passed: boolean };
  } | null;
  pretest: Question[];
  finalTest: Question[];
  modules: Module[];
  progress: { module_id: string; completed_at: string | null }[];
  checklist: string[];
};
const button = 'rounded-xl bg-[#073ca2] px-5 py-3 font-bold text-white disabled:opacity-50';
export function Application({
  initialPreference = 'remote',
}: {
  initialPreference?: 'remote' | 'office' | 'either';
}) {
  const [data, setData] = useState<Candidate | null>(null),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [version, setVersion] = useState(0),
    [busy, setBusy] = useState(false),
    [answers, setAnswers] = useState<Record<string, number[]>>({});
  useEffect(() => {
    let active = true;
    void fetch('/api/tax/careers', { cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (active) {
          setData(d);
          setError('');
        }
      })
      .catch((e) => {
        if (active) setError(e.message || 'APPLICATION_UNAVAILABLE');
      });
    return () => {
      active = false;
    };
  }, [version]);
  async function send(body: Record<string, unknown>) {
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch('/api/tax/careers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setMessage(
        d.score !== undefined
          ? `${d.score}% — ${d.passed ? 'knowledge check passed' : 'review and practice recommended'}. Employment remains subject to hiring-team review.`
          : 'Application received. Complete your skills assessment next.',
      );
      setVersion((v) => v + 1);
    } catch (e) {
      const messages: Record<string, string> = {
        INVALID_APPLICATION:
          'Please review your name, location, professional status and experience, and acknowledge the privacy notice.',
        APPLICATION_ALREADY_EXISTS:
          'You already have an application. Refresh this page to continue your progress.',
        PRETEST_REQUIRED: 'Complete the initial skills assessment before starting the lessons.',
        COMPLETE_TRAINING_FIRST:
          'Complete all eight lesson knowledge checks before taking the final test.',
        INVALID_ASSESSMENT: 'Select an answer for every question, then submit again.',
        APPLICATION_CHANGED_RETRY:
          'Your progress changed in another session. Refresh this page and try again.',
        SIGN_IN_REQUIRED: 'Your session has ended. Sign in again to continue your application.',
      };
      setMessage(
        e instanceof Error
          ? (messages[e.message] ?? 'Your progress could not be saved. Please try again.')
          : 'Your progress could not be saved. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function apply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await send({
      action: 'apply',
      application: {
        name: form.get('name'),
        phone: form.get('phone'),
        location: form.get('location'),
        preference: form.get('preference'),
        credential: form.get('credential'),
        experience: form.get('experience'),
        privacyAcknowledged: form.get('privacy') === 'on',
      },
    });
  }
  function exam(
    kind: string,
    questions: Question[],
    action: 'pretest' | 'final' | 'module',
    moduleId?: string,
  ) {
    return (
      <fieldset className="mt-5 rounded-2xl border p-5">
        <legend className="font-bold">
          {action === 'pretest'
            ? 'Before-training skills assessment'
            : action === 'final'
              ? 'Final system test'
              : 'Knowledge check'}
        </legend>
        {questions.map((q, i) => (
          <div key={q.prompt} className="mb-5">
            <p className="font-semibold">
              {i + 1}. {q.prompt}
            </p>
            {q.options.map((o, n) => (
              <label key={o} className="mt-3 flex gap-3">
                <input
                  type="radio"
                  name={kind + i}
                  checked={answers[kind]?.[i] === n}
                  onChange={() =>
                    setAnswers((a) => {
                      const selected = [...(a[kind] ?? [])];
                      selected[i] = n;
                      return { ...a, [kind]: selected };
                    })
                  }
                />
                {o}
              </label>
            ))}
          </div>
        ))}
        <button
          className={button}
          disabled={busy || questions.some((_, i) => answers[kind]?.[i] === undefined)}
          onClick={() =>
            send({ action, answers: answers[kind], ...(moduleId ? { moduleId } : {}) })
          }
        >
          Submit {action === 'module' ? 'knowledge check' : 'assessment'}
        </button>
      </fieldset>
    );
  }
  if (error === 'SIGN_IN_REQUIRED')
    return (
      <div className="rounded-2xl bg-[#e7efff] p-6">
        <h3 className="text-xl font-bold">Create or use your secure account to apply</h3>
        <p className="mt-3">
          Your application, assessment and training progress stay connected to your account. Already
          have an Elevate account? Use the same sign-in here.
        </p>
        <a
          className={button + ' mt-5 inline-block'}
          href={
            '/tax-software/login?redirect=' +
            encodeURIComponent('/tax-software/careers?work=' + initialPreference + '#apply')
          }
        >
          Sign in / create account →
        </a>
      </div>
    );
  if (error)
    return (
      <p role="alert">
        The application could not load.{' '}
        <button className="underline" onClick={() => setVersion((v) => v + 1)}>
          Retry
        </button>
      </p>
    );
  if (!data) return <p role="status">Loading secure application…</p>;
  return (
    <div className="space-y-6">
      {message && (
        <p className="rounded-xl bg-blue-50 p-4" role="status">
          {message}
        </p>
      )}
      {!data.application ? (
        <form onSubmit={apply} className="grid gap-5 rounded-2xl border p-6">
          <h3 className="text-2xl font-bold">Apply to join the tax team</h3>
          <p className="text-sm leading-6 text-slate-600">
            Do not enter SSNs, banking details, identity-document numbers or background reports.
            Sensitive onboarding documents are requested separately through an approved private
            process.
          </p>
          {[
            ['name', 'Full name'],
            ['phone', 'Phone (optional)'],
            ['location', 'City and state'],
          ].map(([name, label]) => (
            <label key={name} className="font-semibold">
              {label}
              <input
                name={name}
                required={name !== 'phone'}
                maxLength={name === 'phone' ? 30 : 120}
                className="mt-2 block w-full rounded-lg border p-3"
              />
            </label>
          ))}
          <label className="font-semibold">
            Work preference
            <select
              defaultValue={initialPreference}
              name="preference"
              className="mt-2 block w-full rounded-lg border p-3"
            >
              <option value="remote">Remote</option>
              <option value="office">Tax office</option>
              <option value="either">Either</option>
            </select>
          </label>
          <label className="font-semibold">
            Professional status (self-reported)
            <select
              name="credential"
              required
              defaultValue=""
              className="mt-2 block w-full rounded-lg border p-3"
            >
              <option value="" disabled>
                Select your current status
              </option>
              {['CPA', 'EA', 'Attorney', 'PTIN preparer', 'Trainee'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="font-semibold">
            Tax experience and availability
            <textarea
              name="experience"
              required
              minLength={20}
              maxLength={1500}
              className="mt-2 block w-full rounded-lg border p-3"
              rows={5}
            />
          </label>
          <label className="flex gap-3">
            <input type="checkbox" name="privacy" required />I have reviewed the privacy notice and
            understand this submits an application for review. This is not authorization for a
            background check.
          </label>
          <a href="/privacy" className="underline">
            Privacy notice
          </a>
          <button className={button} disabled={busy}>
            Submit application
          </button>
        </form>
      ) : (
        <>
          <p className="rounded-xl bg-slate-50 p-4 font-bold">
            Application received · Hiring review is separate from training.
          </p>
          {!data.application.pretest ? (
            exam('pretest', data.pretest, 'pretest')
          ) : (
            <>
              <section className="rounded-2xl bg-[#e7efff] p-6">
                <h3 className="text-2xl font-bold">Your online system training</h3>
                <p className="mt-3">
                  Your initial assessment is complete ({data.application.pretest.score}%). Complete
                  all eight system modules and their knowledge checks, practice with the mock
                  documents, then take the final test. Passing requires at least 80%; it does not
                  automatically hire you or grant taxpayer access.
                </p>
                <p className="mt-3 font-bold">
                  {data.progress.filter((p) => p.completed_at).length}/8 knowledge checks complete
                </p>
              </section>
              {data.modules.map((m) => (
                <article className="rounded-2xl border p-6" key={m.id}>
                  <h3 className="text-2xl font-bold">{m.title}</h3>
                  <p className="mt-4 whitespace-pre-line leading-8">{m.content}</p>
                  {m.question && exam(m.id, [m.question], 'module', m.id)}
                  {data.progress.some((p) => p.module_id === m.id && p.completed_at) && (
                    <p className="mt-4 font-bold text-green-800">Completed</p>
                  )}
                </article>
              ))}
              <p className="leading-7">
                Complete the fictional practice cases below with your trainer. Candidates receive
                only training content; production tax records require separate office assignment and
                security approval.
              </p>
              {data.progress.filter((p) => p.completed_at).length >= 8 ? (
                exam('final', data.finalTest, 'final')
              ) : (
                <p className="rounded-xl bg-slate-50 p-4">
                  The final test unlocks after all eight knowledge checks pass.
                </p>
              )}
              <section className="mt-8 space-y-5">
                <h3 className="text-2xl font-bold">Practice documents — training only</h3>
                {practiceCases.map((c) => (
                  <article key={c.title} className="rounded-xl border-2 border-dashed p-5">
                    <h4 className="font-bold">
                      {c.title}: {c.name}
                    </h4>
                    {c.documents.map(([title, body]) => (
                      <p className="mt-3 leading-7" key={title}>
                        <strong>{title}:</strong> {body}
                      </p>
                    ))}
                    <ol className="mt-4 list-decimal pl-5">
                      {c.tasks.map((t) => (
                        <li className="mt-2" key={t}>
                          {t}
                        </li>
                      ))}
                    </ol>
                  </article>
                ))}
              </section>
              {data.application.final && (
                <p className="font-bold">
                  Final test: {data.application.final.score}% ·{' '}
                  {data.application.final.passed
                    ? 'Ready for supervisor practical review'
                    : 'Review the material and retake the test'}
                </p>
              )}
            </>
          )}
          <section>
            <h3 className="text-2xl font-bold">Hiring and onboarding checklist</h3>
            <ol className="mt-4 list-decimal space-y-3 pl-5">
              {data.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            <p className="mt-5 rounded-xl bg-amber-50 p-4">
              Background screening and private HR document collection are not connected yet. The
              hiring team must arrange the approved provider, required consent and any applicable
              notices. Do not upload those documents to a general contact form.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
