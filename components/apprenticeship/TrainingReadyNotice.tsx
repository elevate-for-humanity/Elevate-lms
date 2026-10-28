import Link from 'next/link';
import { TrainingVisualGuide } from './TrainingVisualGuide';

export function TrainingReadyNotice({ courseHref }: { courseHref: string }) {
  return (
    <section
      aria-label="Online training and workbook available"
      className="rounded-3xl border-2 border-emerald-400 bg-emerald-50 p-5 text-emerald-950"
      role="status"
    >
      <h2 className="text-xl font-black">Your online training and workbook are ready</h2>
      <p className="mt-2 font-semibold">
        Your 40 lessons and digital workbook are available. Begin with the next lesson in your
        52-week plan. Lessons newly released today are not treated as overdue work.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={courseHref}
          className="rounded-xl bg-emerald-900 px-4 py-3 font-bold text-white"
        >
          Open online training
        </Link>
        <Link
          href="/workbooks/prestige-elevation-cosmetology"
          className="rounded-xl border border-emerald-800 bg-white px-4 py-3 font-bold"
        >
          Open my digital workbook
        </Link>
        <Link
          href="/apprentice/theory-schedule"
          className="rounded-xl border border-emerald-800 bg-white px-4 py-3 font-bold"
        >
          Set my theory study times
        </Link>
      </div>
      <p className="mt-3 text-sm">
        Save your workbook answers to continue later. After each lesson, use Go to lesson completion
        below the video, finish required activities, and save completion. Workbook saves do not
        automatically approve hours.
      </p>
      <TrainingVisualGuide courseHref={courseHref} />
    </section>
  );
}
