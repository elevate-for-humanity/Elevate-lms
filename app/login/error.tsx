'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function LoginError({
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
      title="Login Error"
      backHref="/"
      backLabel="Back to Home"
    />
  );
}
