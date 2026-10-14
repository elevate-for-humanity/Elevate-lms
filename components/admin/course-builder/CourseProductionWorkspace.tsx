'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import UnifiedCourseBuilder from './UnifiedCourseBuilder';
const Browser = dynamic(() => import('@/components/studio/CloudBrowserWorkspace'), { ssr: false,
  loading: () => <p className="p-5 text-slate-900">Loading Studio browser…</p> });
export default function CourseProductionWorkspace({ initialCourseId, initialTab }: {
  initialCourseId: string; initialTab: 'courses' | 'ultimate' | 'registry';
}) {
  const [browserOpen, setBrowserOpen] = useState(true);
  return <div className="course-production-workspace">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 bg-white px-5 py-3 text-slate-950">
      <p className="font-semibold">Build, inspect, and repair lessons in one workspace.</p>
      <button type="button" aria-expanded={browserOpen} onClick={() => setBrowserOpen(value => !value)}
        className="rounded-lg bg-blue-800 px-4 py-3 font-bold text-white">{browserOpen ? 'Hide live browser' : 'Show live browser'}</button>
    </div>
    <div className={browserOpen ? 'grid min-w-0 gap-4 p-4 2xl:grid-cols-2' : ''}>
      <div className="min-w-0"><UnifiedCourseBuilder initialCourseId={initialCourseId} initialTab={initialTab} /></div>
      <section aria-label="Course Builder live browser" className={`${browserOpen ? '' : 'hidden'} min-w-0 rounded-xl border-2 border-slate-300 bg-white text-slate-950`}>
        <header className="border-b border-slate-300 p-4"><h2 className="text-xl font-bold">Live Studio browser</h2>
          <p className="mt-1">Inspect websites, work with assets, and give browser commands. Checkpoint video previews appear in the lesson panel.</p></header>
        <div className="h-[900px] min-h-[600px]"><Browser initialTarget="https://admin.elevateforhumanity.org/studio/courses" /></div>
      </section>
    </div>
  </div>;
}
