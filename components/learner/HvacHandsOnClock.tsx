'use client';

import { useEffect, useState } from 'react';

type Enrollment = { id: string; program_slug: string };
type Session = {
  id: string;
  enrollment_id: string;
  clock_in_at: string;
  clock_out_at: string | null;
  attendance_hours?: { verified: boolean } | null;
};
export default function HvacHandsOnClock() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState('');
  const [attested, setAttested] = useState(false);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  async function load() {
    const res = await fetch('/api/attendance/hands-on', { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not load attendance.');
    setEnrollments(data.enrollments);
    setSessions(data.sessions);
    setSelected((current) => current || data.enrollments[0]?.id || '');
  }
  useEffect(() => {
    load()
      .catch((error) => setMessage(error.message))
      .finally(() => setBusy(false));
  }, []);
  const open = sessions.find((session) => !session.clock_out_at);
  async function act(action: 'clock_in' | 'clock_out') {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch('/api/attendance/hands-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, enrollment_id: open?.enrollment_id || selected, attested }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save attendance.');
      await load();
      setMessage(
        action === 'clock_in'
          ? 'Clock-in saved. Clock out for breaks and when you finish.'
          : 'Clock-out saved. Hours await staff review.',
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Attendance could not be saved.');
    } finally {
      setBusy(false);
    }
  }
  if (!busy && !enrollments.length && !sessions.length && !message) return null;
  return (
    <section className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-6">
      <h2 className="text-xl font-bold">HVAC hands-on training clock</h2>
      <p className="my-3">
        Use this clock only while attending supervised, hands-on HVAC training. Clock in when your
        instructor starts practical training. Clock out for every break and when training ends.
        Do not clock in for online theory, lessons, videos, quizzes, or study at home.
        Submitted hands-on time requires instructor verification.
      </p>
      {enrollments.length > 0 && (
        <label className="block">
          Program enrollment
          <select
            className="ml-3 rounded border p-2"
            disabled={busy || Boolean(open)}
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            {enrollments.map((enrollment) => (
              <option key={enrollment.id} value={enrollment.id}>
                HVAC hands-on training
              </option>
            ))}
          </select>
        </label>
      )}
      {!open && enrollments.length > 0 && <label className="mt-4 flex items-start gap-2 text-sm font-semibold">
        <input type="checkbox" checked={attested} onChange={event => setAttested(event.target.checked)} disabled={busy} />
        I am attending supervised, hands-on HVAC training with my instructor.
      </label>}
      {open && <p className="my-3">Clocked in: {new Date(open.clock_in_at).toLocaleString()}</p>}
      <button
        className="my-4 min-h-11 rounded bg-blue-800 px-5 py-3 font-bold text-white disabled:opacity-50"
        disabled={busy || (!open && (!selected || !attested))}
        onClick={() => act(open ? 'clock_out' : 'clock_in')}
      >
        {busy ? 'Please wait…' : open ? 'Clock out' : 'Clock in for hands-on training'}
      </button>
      {!busy && !enrollments.length && !open && (
        <p>No active HVAC enrollment is available. Contact learner support.</p>
      )}
      <p role="status" aria-live="polite">
        {message}
      </p>
      <h3 className="mt-4 font-bold">Recent hands-on sessions</h3>
      <ul className="list-disc pl-6">
        {sessions.map((session) => (
          <li key={session.id}>
            {new Date(session.clock_in_at).toLocaleString()} —{' '}
            {session.clock_out_at
              ? `${new Date(session.clock_out_at).toLocaleString()} (${session.attendance_hours?.verified ? 'verified' : 'pending verification'})`
              : 'Still clocked in'}
          </li>
        ))}
      </ul>
    </section>
  );
}
