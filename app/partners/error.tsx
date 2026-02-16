'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function PartnersError({
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
      title="Partners Error"
      backHref="/partners"
      backLabel="Back to Partners"
    />
  );
}
