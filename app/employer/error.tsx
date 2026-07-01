'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function EmployerError({
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
      title="Employer Portal Error"
      backHref="/employer"
      backLabel="Back to Employer Portal"
    />
  );
}
