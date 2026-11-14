import type { ReactNode } from 'react';
import CourseTutor from '@/components/lms/CourseTutor';

export default async function LessonLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  return (
    <>
      {children}
      <CourseTutor courseId={courseId} lessonId={lessonId} />
    </>
  );
}
