'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function PricingError({
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
      title="Pricing Error"
      backHref="/pricing"
      backLabel="Back to Pricing"
    />
  );
}
