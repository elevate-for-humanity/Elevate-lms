'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './DashboardReadingSupport.module.css';

const PREFERENCE_KEY = 'elevate-reading-view';

/** A presentation preference, available to every role; never changes authorization. */
export function DashboardReadingSupport({
  children,
  dashboardOnly = false,
}: {
  children: React.ReactNode;
  dashboardOnly?: boolean;
}) {
  const pathname = usePathname() || '/';
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    try {
      setEnabled(localStorage.getItem(PREFERENCE_KEY) !== 'compact');
    } catch {
      /* Storage can be unavailable in private browsing; keep the readable default. */
    }
  }, []);
  function toggle() {
    const next = !enabled;
    setEnabled(next);
    try {
      localStorage.setItem(PREFERENCE_KEY, next ? 'reading' : 'compact');
    } catch {
      /* The current view still works when preference storage is unavailable. */
    }
  }
  if (
    dashboardOnly &&
    !/(?:^|\/)(?:dashboard|account|portal|learner|student|instructor|apprentice|program-holder|host-shop|staff-portal|workforce|lms|admin)(?:\/|$)/.test(
      pathname,
    )
  )
    return <>{children}</>;
  return (
    <div
      className={enabled ? styles.reader : undefined}
      data-reading-view={enabled ? 'reading' : 'compact'}
    >
      <div
        aria-label="Reading settings"
        className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-slate-300 bg-white px-4 py-3 text-slate-950"
      >
        <span className="font-bold">{enabled ? 'Text size: Larger' : 'Text size: Standard'}</span>
        <button
          type="button"
          aria-pressed={enabled}
          aria-label="Reading view"
          onClick={toggle}
          className="min-h-12 rounded-lg border-2 border-slate-700 px-4 py-2 font-bold focus-visible:outline focus-visible:outline-4 focus-visible:outline-blue-700"
        >
          {enabled ? 'Use standard text' : 'Use larger text'}
        </button>
      </div>
      {children}
    </div>
  );
}
