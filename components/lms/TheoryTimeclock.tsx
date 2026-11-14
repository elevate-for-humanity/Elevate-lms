'use client';
import { Clock3 } from 'lucide-react';
import { useTheoryTimeclock } from '@/lib/lms/useTheoryTimeclock';
export function TheoryTimeclockPanel({ clock }: { clock: ReturnType<typeof useTheoryTimeclock> }) {
  return (
    <div
      aria-label="Theory Timeclock"
      className="my-4 rounded-xl border border-cyan-300 bg-cyan-50 p-4 text-slate-950"
    >
      <h2 className="flex items-center gap-2 font-extrabold">
        <Clock3 className="h-4 w-4" />
        Theory Timeclock
      </h2>
      <p className="mt-2 font-bold">
        {(clock.weeklyTheorySeconds / 3600).toFixed(2)} / 10.00 active theory hours this week
      </p>
      <p role="status" className="mt-2 text-sm">
        {clock.theoryMessage}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={clock.startClock}
          disabled={clock.theoryStatus === 'active' || clock.theoryStatus === 'starting'}
          className="rounded-lg bg-cyan-900 px-4 py-3 font-bold text-white disabled:opacity-50"
        >
          Start theory timeclock
        </button>
        <button
          type="button"
          onClick={() => void clock.stopClock()}
          disabled={clock.theoryStatus !== 'active'}
          className="rounded-lg border border-slate-500 px-4 py-3 font-bold disabled:opacity-50"
        >
          Stop theory timeclock
        </button>
        <a href="/apprentice/theory-schedule" className="px-3 py-3 font-bold underline">
          My theory schedule
        </a>
      </div>
    </div>
  );
}
export default function TheoryTimeclock({
  courseId,
  lessonId,
}: {
  courseId: string;
  lessonId: string;
}) {
  const clock = useTheoryTimeclock(courseId, lessonId);
  return <TheoryTimeclockPanel clock={clock} />;
}
