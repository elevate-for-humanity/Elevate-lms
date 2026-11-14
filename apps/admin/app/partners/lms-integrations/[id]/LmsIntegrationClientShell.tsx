'use client';

import { UniversalCoursePlayer } from '@/components/UniversalCoursePlayer';

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
