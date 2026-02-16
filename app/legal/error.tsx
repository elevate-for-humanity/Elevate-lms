'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function LegalError({
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
      title="Legal Error"
      backHref="/legal"
      backLabel="Back to Legal"
    />
  );
}
