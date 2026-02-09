'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function DocsError({
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
      title="Documentation Error"
      backHref="/docs"
      backLabel="Back to Docs"
    />
  );
}
