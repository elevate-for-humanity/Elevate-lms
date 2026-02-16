'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function SupersonicFastCashError({
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
      title="Tax Software Error"
      backHref="/supersonic-fast-cash"
      backLabel="Back to Tax Software"
    />
  );
}
