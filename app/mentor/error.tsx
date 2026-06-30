'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function MentorError({
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
      title="Mentor Error"
      backHref="/mentor"
      backLabel="Back to Mentor"
    />
  );
}
