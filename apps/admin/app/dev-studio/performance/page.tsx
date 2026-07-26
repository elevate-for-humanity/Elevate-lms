'use client';

import dynamic from 'next/dynamic';
import { DashboardPanelErrorBoundary } from '@/components/admin/dashboard/DashboardPanelErrorBoundary';

const LizzyOperationsPanel = dynamic(
  () => import('@/components/admin/dashboard/LizzyOperationsPanel').then(m => m.default || m),
  { ssr: false }
);

export default function DevStudioPerformancePage() {
  return (
    <DashboardPanelErrorBoundary title="Performance">
      <LizzyOperationsPanel />
    </DashboardPanelErrorBoundary>
  );
}
