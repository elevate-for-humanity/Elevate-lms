'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function MessagesError({
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
      title="Messages Error"
      backHref="/messages"
      backLabel="Back to Messages"
    />
  );
}
