'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function CheckoutError({
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
      title="Checkout Error"
      backHref="/checkout"
      backLabel="Back to Checkout"
    />
  );
}
