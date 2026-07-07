'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function ReportsError({
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
      title="Reports Error"
      backHref="/reports"
      backLabel="Back to Reports"
    />
  );
}
