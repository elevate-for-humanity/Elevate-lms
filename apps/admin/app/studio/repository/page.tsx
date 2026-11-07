'use client';

import nextDynamic from 'next/dynamic';

const RepositoryStudioWorkspace = nextDynamic(
  () => import('@/components/studio/RepositoryStudioWorkspace'),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center bg-white text-slate-700">
        Connecting repository workspace…
      </div>
    ),
  },
);

export default function StudioRepositoryPage() {
  return (
    <div className="h-[calc(100vh-4rem)] min-h-[720px]">
      <RepositoryStudioWorkspace />
    </div>
  );
}
