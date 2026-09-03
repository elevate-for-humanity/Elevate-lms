'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function StaffPortalError({
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
      title="Staff Portal Error"
      backHref="/staff-portal/dashboard"
      backLabel="Back to Staff Portal"
    />
  );
}
