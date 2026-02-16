'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function LicenseError({
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
      title="License Error"
      backHref="/license"
      backLabel="Back to License"
    />
  );
}
