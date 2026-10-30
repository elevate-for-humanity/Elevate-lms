'use client';

import { useEffect, useState } from 'react';

/** Portals must not insert children into HTML that React is still hydrating. */
export function HvacVideoAssistanceDock() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  if (!hydrated) return null;
  return (
    <div
      data-hvac-video-assistance
      className="flex flex-wrap items-center justify-center gap-3 px-4 pb-4 empty:hidden"
    />
  );
}
