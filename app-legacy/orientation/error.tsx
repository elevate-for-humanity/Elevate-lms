'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function OrientationError({
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
      title="Orientation Error"
      backHref="/orientation"
      backLabel="Back to Orientation"
    />
  );
}
