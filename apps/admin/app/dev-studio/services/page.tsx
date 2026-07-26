'use client';

import dynamic from 'next/dynamic';
import { DashboardPanelErrorBoundary } from '@/components/admin/dashboard/DashboardPanelErrorBoundary';

const ServicesPanel = dynamic(
  () => import('@/components/studio/ServicesPanel').then(m => m.default || m),
  { ssr: false }
);

export default function DevStudioServicesPage() {
  return (
    <DashboardPanelErrorBoundary title="Services">
      <ServicesPanel />
    </DashboardPanelErrorBoundary>
  );
}
