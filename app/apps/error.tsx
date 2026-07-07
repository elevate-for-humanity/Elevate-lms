'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function AppsError({
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
      title="Apps Error"
      backHref="/apps"
      backLabel="Back to Apps"
    />
  );
}
