'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function ContractsError({
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
      title="Contracts Error"
      backHref="/contracts"
      backLabel="Back to Contracts"
    />
  );
}
