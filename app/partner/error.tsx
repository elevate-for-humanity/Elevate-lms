'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function PartnerError({
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
      title="Partner Portal Error"
      backHref="/partner"
      backLabel="Back to Partner Portal"
    />
  );
}
