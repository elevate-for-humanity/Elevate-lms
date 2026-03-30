'use client';

import dynamicImport from 'next/dynamic';

const JobPlacementTracking = dynamicImport(
  () => import('@/components/JobPlacementTracking').then((m) => ({ default: m.JobPlacementTracking })),
  { ssr: false }
);

const EmployerTalentPipeline = dynamicImport(
  () => import('@/components/EmployerTalentPipeline').then((m) => ({ default: m.EmployerTalentPipeline })),
  { ssr: false }
);

const ExcelChartGenerator = dynamicImport(
  () => import('@/components/admin/ExcelChartGenerator').then((m) => ({ default: m.ExcelChartGenerator })),
  { ssr: false }
);

export default function AnalyticsClientShell() {
  return (
    <div className="mt-10 space-y-8">
      <JobPlacementTracking />
      <EmployerTalentPipeline />
      <ExcelChartGenerator />
    </div>
  );
}
