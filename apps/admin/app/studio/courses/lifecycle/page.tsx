import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CourseLifecyclePage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course } = await searchParams;
  const params = new URLSearchParams({ tab: 'governance' });
  if (course?.trim()) params.set('courseId', course.trim());
  redirect(`/studio/courses?${params.toString()}`);
}
