'use client';

import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundary';

export default function OnboardingError({
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
      title="Onboarding Error"
      backHref="/onboarding"
      backLabel="Back to Onboarding"
    />
  );
}
