'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function AiError({
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
      title="AI Error"
      backHref="/ai"
      backLabel="Back to AI"
    />
  );
}
