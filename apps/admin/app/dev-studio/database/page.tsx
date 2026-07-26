'use client';

import dynamic from 'next/dynamic';
import { DashboardPanelErrorBoundary } from '@/components/admin/dashboard/DashboardPanelErrorBoundary';

const SecretsPanel = dynamic(
  () => import('@/components/studio/SecretsPanel').then(m => m.default || m),
  { ssr: false }
);

export default function DevStudioDatabasePage() {
  return (
    <DashboardPanelErrorBoundary title="Database">
      <SecretsPanel />
    </DashboardPanelErrorBoundary>
  );
}
