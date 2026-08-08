'use client';

import nextDynamic from 'next/dynamic';

const CfdStudioPanel = nextDynamic(() => import('@/components/studio/CfdStudioPanel'), {
  ssr: false,
  loading: () => <div className="flex min-h-[50vh] items-center justify-center bg-slate-950 text-slate-300">Loading CFD Studio…</div>,
});

export default function StudioCfdPage() {
  return <CfdStudioPanel />;
}
