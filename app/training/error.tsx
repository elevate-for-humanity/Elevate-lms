'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function TrainingError({
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
      title="Training Error"
      backHref="/training"
      backLabel="Back to Training"
    />
  );
}
