'use client';

import dynamic from 'next/dynamic';
import { DashboardPanelErrorBoundary } from '@/components/admin/dashboard/DashboardPanelErrorBoundary';

const DeployPanel = dynamic(
  () => import('@/components/studio/DeployPanel').then(m => m.default || m),
  { ssr: false }
);

export default function DevStudioDeploymentsPage() {
  return (
    <DashboardPanelErrorBoundary title="Deployments">
      <DeployPanel />
    </DashboardPanelErrorBoundary>
  );
}
