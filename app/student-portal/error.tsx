'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function StudentPortalError({
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
      title="Student Portal Error"
      backHref="/student-portal"
      backLabel="Back to Student Portal"
    />
  );
}
