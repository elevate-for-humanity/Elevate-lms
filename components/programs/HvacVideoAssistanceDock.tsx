'use client';

import { useEffect, useState } from 'react';

/** Publish the portal target only after React has hydrated its empty container. */
export function HvacVideoAssistanceDock() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  return (
    <div
      data-hvac-video-assistance={ready ? 'ready' : undefined}
      className="flex flex-wrap items-center justify-center gap-3 px-4 pb-4 empty:hidden"
    />
  );
}
