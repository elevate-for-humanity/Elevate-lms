'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function MarketplaceError({
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
      title="Marketplace Error"
      backHref="/marketplace"
      backLabel="Back to Marketplace"
    />
  );
}
