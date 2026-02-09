'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function WorkforceBoardError({
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
      title="Workforce Board Error"
      backHref="/workforce-board"
      backLabel="Back to Workforce Board"
    />
  );
}
