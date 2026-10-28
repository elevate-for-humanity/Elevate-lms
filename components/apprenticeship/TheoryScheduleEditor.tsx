'use client';
import { useEffect, useState } from 'react';
const labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export default function TheoryScheduleEditor() {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(''),
    [saved, setSaved] = useState(false);
  const [days, setDays] = useState<number[]>([]),
    [startTime, setStart] = useState(''),
    [endTime, setEnd] = useState('');
  useEffect(() => {
    let active = true;
    fetch('/api/apprentice/theory-schedule')
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        if (!active) return;
        setData(d);
        setDays(d.schedule.days_of_week);
        setStart(d.schedule.start_time.slice(0, 5));
        setEnd(d.schedule.end_time.slice(0, 5));
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSaved(false);
    const r = await fetch('/api/apprentice/theory-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days, startTime, endTime }),
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error);
      return;
    }
    setSaved(true);
  }
  return (
    <section className="rounded-2xl border border-slate-300 bg-white p-6">
      <h1 className="text-2xl font-black">Choose your theory study times</h1>
      <p className="mt-3">
        Choose downtime when you are not clocked into supervised shop/OJL work. Theory and OJL time
        are separate. Complete this week's assigned work by Sunday at 11:59 PM in your schedule's
        time zone.
      </p>
      {error ? (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-900">
          {error}
        </p>
      ) : null}
      {!data && !error ? <p>Loading your assigned schedule…</p> : null}
      {data ? (
        <>
          <p className="mt-4 font-bold">
            Weekly target: {data.schedule.weekly_target_minutes / 60} hours · Maximum:{' '}
            {Math.min(data.schedule.weekly_max_minutes, 600) / 60} hours · {data.schedule.timezone}
          </p>
          <p className="mt-2">
            These are Elevate scheduling limits, not a statement that Indiana law sets a universal
            weekly theory allowance. Required program totals and approved instruction still apply.
            Do not try to finish all 40 lessons in one sitting. Future lessons and access outside
            your study windows are locked; inactive time does not earn hours.
          </p>
          <p className="mt-2">
            You will receive start/stop reminders and an end-of-week reminder when your weekly
            theory target is still outstanding.
          </p>
          {data.readOnly ? (
            <p className="mt-4 font-bold text-amber-900">
              This is a read-only administrator preview. The learner chooses and saves their own
              study times.
            </p>
          ) : null}
          <form onSubmit={save} className="mt-5 space-y-4">
            <fieldset disabled={data.readOnly}>
              <legend className="font-bold">My available days</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {labels.map((label, i) => (
                  <label key={label} className="flex items-center gap-2 rounded border p-3">
                    <input
                      type="checkbox"
                      checked={days.includes(i + 1)}
                      onChange={(e) =>
                        setDays(
                          e.target.checked ? [...days, i + 1] : days.filter((d) => d !== i + 1),
                        )
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-4">
              <label className="font-bold">
                Start time
                <input
                  aria-label="Theory start time"
                  type="time"
                  required
                  disabled={data.readOnly}
                  value={startTime}
                  onChange={(e) => setStart(e.target.value)}
                  className="ml-3 rounded border p-3"
                />
              </label>
              <label className="font-bold">
                End time
                <input
                  aria-label="Theory end time"
                  type="time"
                  required
                  disabled={data.readOnly}
                  value={endTime}
                  onChange={(e) => setEnd(e.target.value)}
                  className="ml-3 rounded border p-3"
                />
              </label>
            </div>
            <button
              disabled={data.readOnly}
              className="rounded-lg bg-cyan-900 px-5 py-3 font-bold text-white disabled:opacity-50"
            >
              Save my theory schedule
            </button>
            {saved ? (
              <p role="status" className="font-bold text-emerald-800">
                Your study times are saved. Your course uses these windows and the weekly limit.
              </p>
            ) : null}
          </form>
        </>
      ) : null}
    </section>
  );
}
