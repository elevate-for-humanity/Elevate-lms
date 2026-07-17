'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function HvacProgramError({
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
      title="Program Page Error"
      backHref="/programs"
      backLabel="Back to Programs"
    />
  );
}
