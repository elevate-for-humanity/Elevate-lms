'use client';

import nextDynamic from 'next/dynamic';

const CfdStudioPanel = nextDynamic(() => import('@/components/studio/CfdStudioPanel'), {
  ssr: false,
  loading: () => <div className="flex min-h-[50vh] items-center justify-center bg-slate-950 text-slate-300">Loading CFD Studio…</div>,
});

const CfdCaseGenerator = nextDynamic(() => import('@/components/studio/CfdCaseGenerator'), {
  ssr: false,
  loading: () => <div className="p-6 text-slate-300">Loading OpenFOAM case generator…</div>,
});

export default function StudioCfdPage() {
  return (
    <div className="space-y-6 bg-slate-950 pb-8">
      <CfdStudioPanel />
      <CfdCaseGenerator />
    </div>
  );
}
