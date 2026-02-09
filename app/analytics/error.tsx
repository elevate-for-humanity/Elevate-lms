'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function AnalyticsError({
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
      title="Analytics Error"
      backHref="/analytics"
      backLabel="Back to Analytics"
    />
  );
}
