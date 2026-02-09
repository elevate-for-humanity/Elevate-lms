'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function ShopError({
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
      title="Shop Error"
      backHref="/shop"
      backLabel="Back to Shop"
    />
  );
}
