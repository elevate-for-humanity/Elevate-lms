'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function ContactError({
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
      title="Contact Error"
      backHref="/contact"
      backLabel="Back to Contact"
    />
  );
}
