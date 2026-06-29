'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function GovernanceError({
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
      title="Governance Error"
      backHref="/governance"
      backLabel="Back to Governance"
    />
  );
}
