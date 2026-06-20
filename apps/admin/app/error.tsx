'use client';

import AdminErrorBoundary from '@/components/admin/AdminErrorBoundary';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AdminErrorBoundary error={error} reset={reset} />;
}
