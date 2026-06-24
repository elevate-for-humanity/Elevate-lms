'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function HubError({
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
      title="Hub Error"
      backHref="/hub"
      backLabel="Back to Hub"
    />
  );
}
