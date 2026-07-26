'use client';

import dynamic from 'next/dynamic';
import DashboardPanelErrorBoundary from '@/components/admin/dashboard/DashboardPanelErrorBoundary';

const DevContainerPanel = dynamic(
  () => import('@/components/studio/DevContainerPanel').then(m => m.default || m),
  { ssr: false }
);

export default function DevStudioContainersPage() {
  return (
    <DashboardPanelErrorBoundary title="Containers">
      <DevContainerPanel />
    </DashboardPanelErrorBoundary>
  );
}
