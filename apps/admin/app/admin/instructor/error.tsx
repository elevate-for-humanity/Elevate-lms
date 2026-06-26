'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function InstructorError({
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
      title="Instructor Error"
      backHref="/instructor"
      backLabel="Back to Instructor"
    />
  );
}
