'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function PayError({
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
      title="Payment Error"
      backHref="/pay"
      backLabel="Back to Payment Options"
    />
  );
}
