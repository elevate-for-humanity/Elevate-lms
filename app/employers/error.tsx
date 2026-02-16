'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function EmployersError({
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
      title="Employers Error"
      backHref="/employers"
      backLabel="Back to Employers"
    />
  );
}
