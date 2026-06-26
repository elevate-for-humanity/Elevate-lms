'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function PoliciesError({
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
      title="Policies Error"
      backHref="/policies"
      backLabel="Back to Policies"
    />
  );
}
