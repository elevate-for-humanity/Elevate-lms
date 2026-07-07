'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function CalendarError({
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
      title="Calendar Error"
      backHref="/calendar"
      backLabel="Back to Calendar"
    />
  );
}
