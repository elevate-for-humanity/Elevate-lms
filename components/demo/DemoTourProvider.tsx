'use client';

import { TourOverlayWrapper } from './TourOverlay';

/**
 * Adds demo tour overlay to any layout.
 * No Suspense needed — TourOverlay uses useSafeSearchParams from context.
 */
export function DemoTourProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <TourOverlayWrapper />
    </>
  );
}
