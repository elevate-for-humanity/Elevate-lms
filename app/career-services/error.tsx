'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function CareerServicesError({
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
      title="Career Services Error"
      backHref="/career-services"
      backLabel="Back to Career Services"
    />
  );
}
