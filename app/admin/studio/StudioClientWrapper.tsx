'use client';

import dynamic from 'next/dynamic';

const DevStudioUnifiedClient = dynamic(
  () => import('./DevStudioUnifiedClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red-600" />
      </div>
    ),
  }
);

export default function StudioClientWrapper() {
  return <DevStudioUnifiedClient />;
}
