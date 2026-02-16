'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function AboutError({
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
      title="About Error"
      backHref="/about"
      backLabel="Back to About"
    />
  );
}
