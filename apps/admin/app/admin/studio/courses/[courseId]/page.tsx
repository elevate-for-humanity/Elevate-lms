import { Suspense, cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { loadCourseSession } from '@/lib/studio/course-session';
import { CourseProvider } from '@/components/studio/CourseProvider';
import { StudioShell } from '@/components/studio/StudioShell';
import { StudioWorkspace } from '@/components/studio/StudioWorkspace';

// Deduplicate loadCourseSession calls within a single request.
// generateMetadata and StudioContent both call this — cache ensures
// only one set of DB queries runs per page load.
const getCourseSession = cache(loadCourseSession);

export const dynamic = 'force-dynamic';
export const revalidate = 60;

interface Props {
  params: Promise<{ courseId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId } = await params;
  try {
    const session = await getCourseSession(courseId);
    return {
      title: `${session.course.title} — Studio | Elevate Admin`,
      robots: { index: false, follow: false },
    };
  } catch {
    return {
      title: 'Course Studio | Elevate Admin',
      robots: { index: false, follow: false },
    };
  }
}

function StudioLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-brand-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Loading studio…</p>
      </div>
    </div>
  );
}

async function StudioContent({ courseId }: { courseId: string }) {
  let session;
  try {
    session = await getCourseSession(courseId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('not found') || msg.includes('ERR_STUDIO_COURSE_NOT_FOUND')) {
      notFound();
    }
    throw err;
  }

  return (
    <CourseProvider session={session}>
      <StudioShell>
        <StudioWorkspace />
      </StudioShell>
    </CourseProvider>
  );
}

export default async function StudioPage({ params }: Props) {
  const { courseId } = await params;
  return (
    <Suspense fallback={<StudioLoading />}>
      <StudioContent courseId={courseId} />
    </Suspense>
  );
}
