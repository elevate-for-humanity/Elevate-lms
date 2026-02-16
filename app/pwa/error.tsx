'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function PwaError({
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
      title="App Error"
      backHref="/pwa"
      backLabel="Back to App"
    />
  );
}
