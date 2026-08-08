'use client';

import nextDynamic from 'next/dynamic';

const MediaStudioPanel = nextDynamic(() => import('@/components/studio/MediaStudioPanel'), {
  ssr: false,
  loading: () => <div className="flex min-h-[50vh] items-center justify-center bg-slate-950 text-slate-300">Loading Media Studio…</div>,
});

export default function StudioMediaPage() {
  return <MediaStudioPanel />;
}
