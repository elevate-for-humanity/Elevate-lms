'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function SupportError({
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
      title="Support Error"
      backHref="/support"
      backLabel="Back to Support"
    />
  );
}
