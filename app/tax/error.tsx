'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function TaxError({
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
      title="Tax Services Error"
      backHref="/tax"
      backLabel="Back to Tax Services"
    />
  );
}
