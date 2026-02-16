'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function NonprofitError({
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
      title="Nonprofit Error"
      backHref="/nonprofit"
      backLabel="Back to Nonprofit"
    />
  );
}
