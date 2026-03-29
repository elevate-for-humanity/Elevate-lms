import { redirect } from 'next/navigation';

// All course detail pages consolidated into the DB-driven LMS
export default async function CourseRedirect({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  redirect(`/lms/courses/${courseId}`);
}
