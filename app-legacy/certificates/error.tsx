'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function CertificatesError({
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
      title="Certificates Error"
      backHref="/certificates"
      backLabel="Back to Certificates"
    />
  );
}
