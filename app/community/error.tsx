'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function CommunityError({
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
      title="Community Error"
      backHref="/community"
      backLabel="Back to Community"
    />
  );
}
