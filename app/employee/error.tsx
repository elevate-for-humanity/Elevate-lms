'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function EmployeeError({
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
      title="Employee Error"
      backHref="/employee"
      backLabel="Back to Employee"
    />
  );
}
