'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function FerpaError({
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
      title="FERPA Error"
      backHref="/ferpa"
      backLabel="Back to FERPA"
    />
  );
}
