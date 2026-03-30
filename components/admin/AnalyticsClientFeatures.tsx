'use client';
import dynamic from 'next/dynamic';

const JobPlacementTracking = dynamic(() => import('@/components/analytics/JobPlacementTracking'), { ssr: false });
const EmployerTalentPipeline = dynamic(() => import('@/components/analytics/EmployerTalentPipeline'), { ssr: false });
const ExcelChartGenerator = dynamic(() => import('@/components/admin/ExcelChartGenerator'), { ssr: false });

export default function AnalyticsClientFeatures() {
  return (
    <>
      <JobPlacementTracking />
      <EmployerTalentPipeline />
      <ExcelChartGenerator />
    </>
  );
}
