'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function FundingError({
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
      title="Funding Error"
      backHref="/funding"
      backLabel="Back to Funding"
    />
  );
}
