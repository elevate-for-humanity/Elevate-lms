'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function CreatorError({
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
      title="Creator Error"
      backHref="/creator"
      backLabel="Back to Creator"
    />
  );
}
