'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function ApplyError({
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
      title="Application Error"
      backHref="/apply"
      backLabel="Back to Applications"
    />
  );
}
