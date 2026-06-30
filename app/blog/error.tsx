'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function BlogError({
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
      title="Blog Error"
      backHref="/blog"
      backLabel="Back to Blog"
    />
  );
}
