'use client';
import dynamic from 'next/dynamic';

const UniversalCoursePlayer = dynamic(() => import('@/components/UniversalCoursePlayer'), { ssr: false });

export default function LmsIntegrationClientFeatures() {
  return (
    <>
      <UniversalCoursePlayer />
    </>
  );
}
