import type { Metadata } from 'next';
import { CourseProvider } from '@/components/studio/CourseProvider';
import { CourseStudioApplication } from '@/components/studio/CourseStudioApplication';
import { StudioWorkspace } from '@/components/studio/StudioWorkspace';
import { loadCourseSession } from '@/lib/studio/course-session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Course Studio | Dev Studio',
  robots: { index: false, follow: false },
};

export default async function CourseStudioPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await loadCourseSession(courseId);

  return (
    <CourseProvider session={session}>
      <CourseStudioApplication>
        <StudioWorkspace />
      </CourseStudioApplication>
    </CourseProvider>
  );
}
