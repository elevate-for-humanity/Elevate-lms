'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import UnifiedCourseBuilder from './UnifiedCourseBuilder';
const Browser = dynamic(() => import('@/components/studio/CloudBrowserWorkspace'), {
  ssr: false,
  loading: () => <p className="p-4 text-slate-800">Loading cloud browser…</p>,
});

/** Compact workbench: independently scrollable builder + browser on desktop,
 * one focused panel at a time on phones, like a mobile chat/workspace UI.
 * Neither surface is unmounted when switching panels, preserving browser state.
 */
export default function CourseProductionWorkspace({ initialCourseId, initialTab }: {
  initialCourseId: string; initialTab: 'courses' | 'ultimate' | 'registry';
}) {
  const [browserOpen, setBrowserOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<'builder' | 'browser'>('builder');
  return <div className="course-production-workspace min-w-0">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-white px-3 py-2 text-slate-950 sm:px-4">
      <p className="text-sm font-semibold">Course Builder · saved lesson + live cloud browser</p>
      <button type="button" aria-expanded={browserOpen} onClick={() => {
        setBrowserOpen(value => !value);
        setMobilePane(browserOpen ? 'builder' : 'browser');
      }} className="min-h-11 rounded-lg bg-blue-800 px-3 py-2 text-sm font-bold text-white">
        {browserOpen ? 'Close cloud browser' : 'Open cloud browser'}
      </button>
    </div>
    {browserOpen && <nav aria-label="Mobile course workspace panels" className="grid grid-cols-2 gap-2 border-b border-slate-200 bg-white p-2 lg:hidden">
      <button type="button" aria-pressed={mobilePane === 'builder'} onClick={() => setMobilePane('builder')} className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${mobilePane === 'builder' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`}>Course + lesson</button>
      <button type="button" aria-pressed={mobilePane === 'browser'} onClick={() => setMobilePane('browser')} className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${mobilePane === 'browser' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`}>Cloud browser</button>
    </nav>}
    <div data-course-browser-workspace className={browserOpen ? 'grid min-w-0 gap-2 p-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-3 lg:p-3' : 'min-w-0'}>
      <div className={`min-w-0 ${browserOpen && mobilePane === 'browser' ? 'hidden lg:block' : ''}`}>
        <UnifiedCourseBuilder initialCourseId={initialCourseId} initialTab={initialTab} embedded />
      </div>
      {browserOpen && <section aria-label="Course Builder live browser" className={`${mobilePane === 'builder' ? 'hidden lg:block' : ''} min-w-0 overflow-hidden rounded-xl border border-slate-300 bg-white text-slate-950 lg:sticky lg:top-2 lg:self-start`}>
        <header className="border-b border-slate-200 px-3 py-2">
          <h2 className="text-sm font-bold">Cloud browser · asset acquisition</h2>
          <p className="text-xs leading-5 text-slate-700">Browse licensed media while reviewing the saved lesson on the left. Website sign-ins are separate from Admin.</p>
        </header>
        <div className="h-[min(72dvh,760px)] min-h-[340px] min-w-0 overflow-hidden lg:h-[min(82dvh,860px)]">
          <Browser initialTarget="https://elements.envato.com" />
        </div>
      </section>}
    </div>
  </div>;
}
