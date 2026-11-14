import Image from 'next/image';
import { PRESTIGE_COURSE_COVERS } from '@/lib/lms/prestige-course-covers';
import Link from 'next/link';
import { TrainingVisualGuide } from './TrainingVisualGuide';
export function TrainingReadyNotice({ courseHref }: { courseHref: string }) {
  return (
    <section aria-label="Online training and workbook available" className="space-y-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <Link href={courseHref} aria-label="Open Prestige Cosmetology course" className="shrink-0 self-start"><Image src={PRESTIGE_COURSE_COVERS.cosmetology} alt="Prestige Cosmetology course cover" width={96} height={144} className="h-auto w-24 rounded-lg" /></Link>
        <div><p className="text-xs font-semibold uppercase tracking-widest text-teal-800">Ready when you are</p><h2 className="mt-1 text-xl font-semibold text-slate-950">Your course &amp; workbook</h2><p className="mt-1 text-sm text-slate-600">40 lessons · Your personal 52-week plan</p></div>
        <div className="flex flex-wrap gap-2">
          <Link href={courseHref} className="rounded-xl bg-teal-800 px-4 py-3 text-sm font-semibold text-white">Open lessons →</Link>
          <Link href="/workbooks/prestige-elevation-cosmetology" className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800">Workbook →</Link>
          <Link href="/apprentice/theory-schedule" className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800">Study times →</Link>
        </div>
      </div>
      <TrainingVisualGuide courseHref={courseHref} />
    </section>
  );
}

