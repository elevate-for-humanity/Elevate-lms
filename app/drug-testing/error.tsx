'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function DrugTestingError({
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
      title="Drug Testing Error"
      backHref="/drug-testing"
      backLabel="Back to Drug Testing"
    />
  );
}
