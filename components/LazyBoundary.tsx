'use client';

import { Suspense, ReactNode } from 'react';

interface LazyBoundaryProps {
  /** Content to render while the lazy component is loading */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * LazyBoundary — lightweight Suspense wrapper for lazily-loaded components.
 *
 * Usage:
 *   const HeavyWidget = React.lazy(() => import('./HeavyWidget'));
 *
 *   <LazyBoundary>
 *     <HeavyWidget />
 *   </LazyBoundary>
 */
export default function LazyBoundary({ fallback = null, children }: LazyBoundaryProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
