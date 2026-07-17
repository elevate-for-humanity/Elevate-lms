'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function ApprenticeError({
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
      title="Apprentice Error"
      backHref="/apprentice"
      backLabel="Back to Apprentice"
    />
  );
}
