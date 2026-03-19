import { redirect } from 'next/navigation';

// Legacy lesson renderer outside LMS shell.
// Canonical: /lms/courses/[courseId]/lessons/[lessonId]
export default function LegacyLessonRedirect({
  params,
}: {
  params: { courseId: string; lessonId: string };
}) {
  redirect(`/lms/courses/${params.courseId}/lessons/${params.lessonId}`);
}
