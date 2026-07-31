'use client';

import nextDynamic from 'next/dynamic';

// Prevent Next.js from prerendering this client component at build time.
// The DevStudioUnifiedClient uses browser-only APIs (WebContainer, Monaco, etc.)
// that cannot execute during static generation.
export const dynamic = 'force-dynamic';

const DevStudioUnifiedClient = nextDynamic(
  () => import('./DevStudioUnifiedClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red-600"></div>
      </div>
    )
  }
);

export default function StudioPage() {
  return <DevStudioUnifiedClient />;
}
