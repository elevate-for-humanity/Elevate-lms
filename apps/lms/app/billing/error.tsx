'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function BillingError({
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
      title="Billing Error"
      backHref="/billing"
      backLabel="Back to Billing"
    />
  );
}
