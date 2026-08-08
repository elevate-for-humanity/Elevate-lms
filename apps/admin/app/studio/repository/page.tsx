'use client';

import nextDynamic from 'next/dynamic';

const RealRepoWorkspace = nextDynamic(() => import('@/components/studio/RealRepoWorkspace'), {
  ssr: false,
  loading: () => <div className="flex min-h-[60vh] items-center justify-center bg-slate-950 text-slate-300">Connecting repository…</div>,
});

export default function StudioRepositoryPage() {
  return <div className="h-[calc(100vh-4rem)] min-h-[680px]"><RealRepoWorkspace className="h-full" /></div>;
}
