'use client';

import { lazy, Suspense, useState } from 'react';

const ParisChat = lazy(() => import('@/components/paris/ParisChat'));

export default function StoreDemoAdvisor({ label = 'this workspace' }: { label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <summary className="min-h-12 cursor-pointer px-4 py-3 text-sm font-bold text-brand-blue-900">
        Questions about {label}? Ask PARIS
      </summary>
      {open ? (
        <Suspense fallback={<p className="p-4 text-sm text-slate-700">Loading your advisor…</p>}>
          <ParisChat
            surface="store"
            showHeader={false}
            voiceEnabled={false}
            className="h-[min(460px,65dvh)] min-h-[320px] border-t border-slate-200 [&_p]:!text-sm [&_p]:!leading-6"
          />
        </Suspense>
      ) : null}
    </details>
  );
}
