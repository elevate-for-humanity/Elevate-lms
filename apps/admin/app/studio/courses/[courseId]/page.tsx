import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CourseStudioPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  redirect(`/studio/courses?courseId=${encodeURIComponent(courseId)}&tab=workspace`);
}
