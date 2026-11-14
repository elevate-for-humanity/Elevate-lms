'use client';

import AdminErrorBoundary from '@/components/admin/AdminErrorBoundary';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <AdminErrorBoundary error={error} reset={reset} />
      </body>
    </html>
  );
}
