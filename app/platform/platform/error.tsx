'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function PlatformError({
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
      title="Platform Error"
      backHref="/platform"
      backLabel="Back to Platform"
    />
  );
}
