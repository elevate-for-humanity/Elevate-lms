'use client';

import dynamicImport from 'next/dynamic';

const UniversalCoursePlayer = dynamicImport(
  () =>
    import('@/components/UniversalCoursePlayer').then((m) => ({
      default: m.UniversalCoursePlayer,
    })),
  { ssr: false }
);

interface Props {
  courseId: string;
  courseName: string;
  partnerName: string;
  courseUrl: string;
  userId: string;
  enrollmentId: string;
}

export default function LmsIntegrationClientShell(props: Props) {
  return <UniversalCoursePlayer {...props} />;
}
