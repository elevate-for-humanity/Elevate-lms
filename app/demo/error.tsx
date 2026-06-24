'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function DemoError({
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
      title="Demo Error"
      backHref="/demo"
      backLabel="Back to Demo"
    />
  );
}
