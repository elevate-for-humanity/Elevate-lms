'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function CurvatureBodySculptingError({
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
      title="Curvature Error"
      backHref="/curvature-body-sculpting"
      backLabel="Back to Curvature"
    />
  );
}
