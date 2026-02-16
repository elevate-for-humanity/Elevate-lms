'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function AuthError({
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
      title="Authentication Error"
      backHref="/auth/login"
      backLabel="Back to Authentication"
    />
  );
}
