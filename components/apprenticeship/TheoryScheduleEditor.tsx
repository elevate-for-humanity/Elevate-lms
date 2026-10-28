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
        setDays(d.schedule.learner_confirmed_at ? d.schedule.days_of_week : []);
        setStart(d.schedule.learner_confirmed_at ? d.schedule.start_time.slice(0, 5) : '');
        setEnd(d.schedule.learner_confirmed_at ? d.schedule.end_time.slice(0, 5) : '');
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const minutes = (value: string) => {
    const [hour, minute] = value.split(':').map(Number);
    return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : 0;
  };
  const selectedMinutes = Math.max(0, minutes(endTime) - minutes(startTime)) * days.length;
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
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-teal-800">Build your study week</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">When works for you?</h1>
      <p className="mt-3 text-slate-600">Pick downtime outside your shop hours. You can study during these saved windows.</p>
      {error ? (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-900">
          {error}
        </p>
      ) : null}
      {!data && !error ? <p>Loading your assigned schedule…</p> : null}
      {data ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-5"><p className="text-sm text-slate-500">Your weekly target</p><p className="mt-2 text-3xl font-semibold text-slate-950">{data.schedule.weekly_target_minutes / 60}<span className="text-base"> hours</span></p></div>
            <div className="rounded-2xl bg-slate-50 p-5"><p className="text-sm text-slate-500">Your selected time</p><p className="mt-2 text-3xl font-semibold text-teal-800">{(selectedMinutes / 60).toLocaleString('en-US', { maximumFractionDigits: 2 })}<span className="text-base"> hours</span></p></div>
          </div>
          <details className="mt-4 rounded-xl border border-slate-200 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Weekly limits &amp; reminders</summary>
            <p className="mt-3 text-sm leading-6 text-slate-600">Maximum: {Math.min(data.schedule.weekly_max_minutes, 600) / 60} theory hours weekly. These are Elevate scheduling limits. Approved program totals apply. Lessons follow your release plan; future lessons and access outside study windows stay locked. Inactive time earns no hours.</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">After saving your schedule, start/stop reminders follow your study blocks. If your weekly target remains unfinished, you receive an end-of-week reminder. Finish by Sunday at 11:59 PM ({data.schedule.timezone}).</p>
          </details>
          {data.readOnly ? (
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              This is a read-only administrator preview. The learner chooses and saves their own
              study times.
            </p>
          ) : null}
          <form onSubmit={save} className="mt-6 space-y-5">
            <fieldset disabled={data.readOnly}>
              <legend className="font-semibold text-slate-950">1. Choose your days</legend>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {labels.map((label, i) => (
                  <label key={label} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-semibold ${days.includes(i + 1) ? 'border-teal-800 bg-teal-50 text-teal-950' : 'border-slate-200 text-slate-600'}`}>
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
            <p className="font-semibold text-slate-950">2. Set your study window</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="font-bold">
                Start time
                <input
                  aria-label="Theory start time"
                  type="time"
                  required
                  disabled={data.readOnly}
                  value={startTime}
                  onChange={(e) => setStart(e.target.value)}
                  className="mt-2 block min-h-12 w-full rounded-xl border border-slate-300 p-3 font-normal"
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
                  className="mt-2 block min-h-12 w-full rounded-xl border border-slate-300 p-3 font-normal"
                />
              </label>
            </div>
            <button
              disabled={data.readOnly || !days.length || !startTime || !endTime}
              className="min-h-12 w-full rounded-xl bg-teal-800 px-5 py-3 font-semibold text-white hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
