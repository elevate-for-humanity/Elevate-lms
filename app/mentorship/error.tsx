'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function MentorshipError({
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
      title="Mentorship Error"
      backHref="/mentorship"
      backLabel="Back to Mentorship"
    />
  );
}
