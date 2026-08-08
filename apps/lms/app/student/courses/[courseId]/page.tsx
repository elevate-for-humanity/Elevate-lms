import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LegacyStudentCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  redirect(`/lms/courses/${encodeURIComponent(courseId)}`);
}
