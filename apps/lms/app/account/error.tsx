'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function AccountError({
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
      title="Account Error"
      backHref="/account"
      backLabel="Back to Account"
    />
  );
}
