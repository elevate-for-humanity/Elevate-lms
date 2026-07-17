'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function EnrollmentError({
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
      title="Enrollment Error"
      backHref="/enrollment"
      backLabel="Back to Enrollment"
    />
  );
}
