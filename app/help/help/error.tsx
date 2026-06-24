'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function HelpError({
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
      title="Help Center Error"
      backHref="/help"
      backLabel="Back to Help"
    />
  );
}
