'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function FranchiseError({
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
      title="Franchise Error"
      backHref="/franchise"
      backLabel="Back to Franchise"
    />
  );
}
