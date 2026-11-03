'use client';
import { useEffect, useState } from 'react';
const endpoint = '/api/testing/certification';
export default function CertificationConsole() {
  const [data, setData] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    const response = await fetch(endpoint, { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not load certification operations');
    setData(result.data);
  }
  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);
  async function action(payload: any) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Operation failed');
      if (result.data?.attemptId)
        setMessage(
          `Exam ready. Candidate link: https://lms.elevateforhumanity.org/exams/native/${result.data.attemptId}`,
        );
      else setMessage('Saved successfully.');
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Operation failed');
    } finally {
      setBusy(false);
    }
  }
  const approved = data?.authority?.status === 'approved';
  return (
    <div className="mt-6 space-y-6">
      {message && (
        <p role="status" className="break-words rounded-xl border bg-blue-50 p-4">
          {message}
        </p>
      )}
      <section className="rounded-xl border p-5">
        <h2 className="text-xl font-bold">EPA authorization</h2>
        <p className="mt-2">
          {data
            ? approved
              ? 'Independent EPA certification approval recorded.'
              : 'Independent EPA certification approval pending. Official exam delivery and credential issuance are unavailable until approval is recorded.'
            : 'Loading authorization…'}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Existing ESCO and Mainstream testing remains available through Exam sessions.
        </p>
      </section>
      <section className="rounded-xl border p-5">
        <h2 className="text-xl font-bold">Registered proctors</h2>
        <ul className="my-3 space-y-2">
          {data?.proctors?.map((p: any) => (
            <li key={p.id}>
              {p.site_name} — {p.status}
            </li>
          ))}
        </ul>
        {data?.canManage && (
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              action({
                action: 'register-proctor',
                userId: f.get('userId'),
                siteName: f.get('siteName'),
                siteAddress: f.get('siteAddress'),
                status: f.get('status'),
                trainingVerified: f.get('training') === 'on',
              });
            }}
          >
            <label>
              Proctor account ID
              <input name="userId" required className="mt-1 block w-full rounded border p-2" />
            </label>
            <label>
              Site name
              <input name="siteName" required className="mt-1 block w-full rounded border p-2" />
            </label>
            <label>
              Site address
              <input name="siteAddress" required className="mt-1 block w-full rounded border p-2" />
            </label>
            <label>
              Status
              <select name="status" className="mt-1 block w-full rounded border p-2">
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
            <label>
              <input name="training" type="checkbox" /> Proctor training verified
            </label>
            <button disabled={busy} className="rounded bg-blue-700 px-4 py-2 font-bold text-white">
              Save proctor
            </button>
          </form>
        )}
      </section>
      <section className="rounded-xl border p-5">
        <h2 className="text-xl font-bold">Authorized question banks</h2>
        <ul className="my-3">
          {data?.banks?.map((b: any) => (
            <li key={`${b.bank_version}-${b.section}`}>
              {b.bank_version}: {b.section} — {b.questions} questions
            </li>
          ))}
        </ul>
        <p className="my-3 text-sm">
          Official bank imports require EPA approval. Practice questions are kept separate. Import
          format: sourceReference, section, prompt, choices, correctIndex.
        </p>
        {data?.canManage && (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                const file = f.get('bank') as File;
                await action({
                  action: 'import-bank',
                  bankVersion: f.get('version'),
                  questions: JSON.parse(await file.text()),
                });
              } catch {
                setMessage('Select a valid JSON question-bank file.');
              }
            }}
          >
            <label className="block">
              Bank version
              <input name="version" required className="ml-3 rounded border p-2" />
            </label>
            <input
              name="bank"
              type="file"
              accept="application/json,.json"
              required
              disabled={!approved}
            />
            <button
              disabled={busy || !approved}
              className="ml-3 rounded bg-blue-700 px-4 py-2 font-bold text-white disabled:opacity-50"
            >
              Import official bank
            </button>
          </form>
        )}
      </section>
      <section className="rounded-xl border p-5">
        <h2 className="text-xl font-bold">Start an official exam</h2>
        <p className="my-3 text-sm">
          First check in the candidate and verify photo ID in Exam sessions. Only the assigned
          registered proctor can start the exam.
        </p>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            action({
              action: 'start',
              sessionId: f.get('session'),
              examType: f.get('type'),
              bankVersion: f.get('version'),
              address: f.get('address'),
              city: f.get('city'),
              directoryOptOut: f.get('optout') === 'on',
            });
          }}
        >
          <label>
            Exam session ID
            <input name="session" required className="mt-1 block w-full rounded border p-2" />
          </label>
          <label>
            Bank version
            <input name="version" required className="mt-1 block w-full rounded border p-2" />
          </label>
          <label>
            Exam
            <select name="type" className="mt-1 block w-full rounded border p-2">
              <option value="universal">Universal</option>
              <option value="type_i">Type I</option>
              <option value="type_ii">Type II</option>
              <option value="type_iii">Type III</option>
            </select>
          </label>
          <label>
            Candidate address
            <input name="address" required className="mt-1 block w-full rounded border p-2" />
          </label>
          <label>
            Candidate city
            <input name="city" required className="mt-1 block w-full rounded border p-2" />
          </label>
          <label>
            <input type="checkbox" name="optout" defaultChecked /> Candidate opts out of public
            directory
          </label>
          <button
            disabled={busy || !approved}
            className="rounded bg-blue-700 px-4 py-2 font-bold text-white disabled:opacity-50"
          >
            Start exam
          </button>
        </form>
      </section>
      <section className="rounded-xl border p-5">
        <h2 className="text-xl font-bold">Results and certificates</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Exam</th>
                <th>Result</th>
                <th>Certificate</th>
              </tr>
            </thead>
            <tbody>
              {data?.attempts?.map((a: any) => (
                <tr className="border-t" key={a.id}>
                  <td className="py-3">{a.candidate_name}</td>
                  <td>{a.exam_type}</td>
                  <td>{!a.submitted_at ? 'In progress' : a.passed ? 'Passed' : 'Failed'}</td>
                  <td>
                    {a.certificate_number ? (
                      <a
                        className="text-blue-700 underline"
                        href={`/api/testing/certification/card?attemptId=${a.id}`}
                      >
                        Download card
                      </a>
                    ) : (
                      <button
                        disabled={busy || !approved || !a.passed || !data?.canManage}
                        onClick={() => action({ action: 'issue', attemptId: a.id })}
                        className="rounded border px-3 py-2 disabled:opacity-50"
                      >
                        Issue certificate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {data?.canManage && (
        <section className="rounded-xl border p-5">
          <h2 className="text-xl font-bold">Six-month EPA activity report</h2>
          <form action={endpoint} className="mt-3 flex flex-wrap gap-3">
            <input name="report" value="epa" type="hidden" />
            <label>
              Year
              <input
                name="year"
                type="number"
                min="2000"
                max="2200"
                defaultValue={new Date().getFullYear()}
                className="ml-2 w-24 rounded border p-2"
              />
            </label>
            <label>
              Period
              <select name="half" className="ml-2 rounded border p-2">
                <option value="1">January–June</option>
                <option value="2">July–December</option>
              </select>
            </label>
            <button className="rounded bg-blue-700 px-4 py-2 font-bold text-white">
              Download report
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
