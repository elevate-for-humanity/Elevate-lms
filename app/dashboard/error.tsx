'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function DashboardError({
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
      title="Dashboard Error"
      backHref="/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}
