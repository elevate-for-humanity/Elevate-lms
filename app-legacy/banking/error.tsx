'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function BankingError({
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
      title="Banking Error"
      backHref="/banking"
      backLabel="Back to Banking"
    />
  );
}
