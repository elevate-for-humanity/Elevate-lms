'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function StoreError({
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
      title="Store Error"
      backHref="/store"
      backLabel="Back to Store"
    />
  );
}
