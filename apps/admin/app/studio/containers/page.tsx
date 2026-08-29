'use client';

import nextDynamic from 'next/dynamic';

const DevContainerPanel = nextDynamic(() => import('@/components/studio/DevContainerPanel'), {
  ssr: false,
  loading: () => <div className="flex min-h-[50vh] items-center justify-center bg-white text-slate-600">Loading container runtime…</div>,
});

const ServicesPanel = nextDynamic(() => import('@/components/studio/ServicesPanel'), {
  ssr: false,
});

export default function StudioContainersPage() {
  return (
    <div className="grid min-h-screen gap-4 bg-slate-50 p-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><DevContainerPanel /></div>
      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><ServicesPanel /></div>
    </div>
  );
}
