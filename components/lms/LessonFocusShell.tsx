'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Minimize2, Maximize2 } from 'lucide-react';

export default function LessonFocusShell({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFocused(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focused]);

  return (
    <main
      className={focused ? 'min-h-screen bg-white text-slate-950' : 'min-h-screen bg-slate-50 text-slate-950'}
      data-focus-mode={focused ? 'active' : 'inactive'}
    >
      {!focused ? header : null}
      <div className={focused ? 'mx-auto max-w-3xl px-4 py-6 sm:px-6' : 'mx-auto max-w-5xl px-4 pt-4 sm:px-6'}>
        <div className="flex justify-end">
          <button
            type="button"
            aria-pressed={focused}
            aria-label={focused ? 'Exit focus mode' : 'Enter focus mode'}
            onClick={() => setFocused((value) => !value)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-cyan-200"
          >
            {focused ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
            {focused ? 'Exit Focus Mode' : 'Focus Mode'}
          </button>
        </div>
        {focused ? <p className="mt-2 text-right text-xs text-slate-600">Press Escape to exit.</p> : null}
      </div>
      {children}
    </main>
  );
}
