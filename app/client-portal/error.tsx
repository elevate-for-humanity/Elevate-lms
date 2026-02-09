'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function ClientPortalError({
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
      title="Portal Error"
      backHref="/client-portal"
      backLabel="Back to Portal"
    />
  );
}
