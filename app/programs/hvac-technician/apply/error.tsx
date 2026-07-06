'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function HvacApplyError({
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
      title="Enrollment Error"
      backHref="/programs/hvac-technician"
      backLabel="Back to HVAC Program"
    />
  );
}
