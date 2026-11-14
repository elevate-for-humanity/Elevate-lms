'use client';

import nextDynamic from 'next/dynamic';

const MediaStudioPanel = nextDynamic(() => import('@/components/studio/MediaStudioPanel'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] items-center justify-center bg-gradient-to-b from-cyan-50 via-white to-rose-50 font-semibold text-slate-600">
      Loading Media Studio…
    </div>
  ),
});

export default function StudioMediaPage() {
  return <MediaStudioPanel />;
}
