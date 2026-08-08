'use client';

import nextDynamic from 'next/dynamic';

// Prevent browser-only Studio dependencies from rendering on the server.
export const dynamic = 'force-dynamic';

const DevStudioUnifiedClient = nextDynamic(
  () => import('./DevStudioUnifiedClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-red-600" />
      </div>
    ),
  },
);

export default function StudioPage() {
  // DevStudioUnifiedClient still exposes a legacy capability flag. In the current
  // platform model, authenticated `admin` is the sole privileged Studio role.
  return <DevStudioUnifiedClient isSuperAdmin />;
}
