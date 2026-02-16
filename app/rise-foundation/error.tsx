'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function RiseFoundationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundaryUI
      error={error}
      reset={reset}
      title="Rise Foundation Error"
      backHref="/rise-foundation"
      backLabel="Back to Rise Foundation"
    />
  );
}
