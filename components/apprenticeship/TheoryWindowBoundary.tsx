'use client';
import { useEffect, useRef, useState } from 'react';
import { TheoryWindowNotice } from './TheoryWindowNotice';
export function TheoryWindowBoundary({
  courseId,
  readOnly,
  children,
}: {
  courseId: string;
  readOnly: boolean;
  children: React.ReactNode;
}) {
  const [closed, setClosed] = useState<any>(null);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (readOnly) return;
    let active = true;
    async function check() {
      try {
        const r = await fetch('/api/apprentice/theory-schedule', { cache: 'no-store' });
        if (!r.ok) return;
        const d = await r.json();
        if (active && d.schedule?.course_id === courseId && d.access?.allowed === false) {
          root.current?.querySelectorAll('video').forEach((video) => video.pause());
          setClosed(d.access);
        }
      } catch {
        /* Server routes continue to enforce access when the network is unavailable. */
      }
    }
    void check();
    const timer = window.setInterval(check, 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [courseId, readOnly]);
  return <div ref={root}>{closed ? <TheoryWindowNotice access={closed} /> : children}</div>;
}
