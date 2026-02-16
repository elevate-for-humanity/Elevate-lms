'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function FormsError({
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
      title="Forms Error"
      backHref="/forms"
      backLabel="Back to Forms"
    />
  );
}
