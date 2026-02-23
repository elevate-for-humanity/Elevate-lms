import { Metadata } from 'next';
import { getCourseBySlug } from '@/lib/courses/definitions';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import HvacCourseViewer from './HvacCourseViewer';

export const metadata: Metadata = {
  title: 'HVAC Technician Course | Elevate for Humanity',
  description:
    'HVAC Technician course: 16 modules, 94 lessons. Track your progress, complete certifications, and advance your career.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/hvac-technician/course',
  },
};

export const dynamic = 'force-dynamic';

const HVAC_COURSE_ID = 'f0593164-55be-5867-98e7-8a86770a8dd0';
const HVAC_PROGRAM_ID = '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7';

export default async function HvacCoursePage() {
  const course = getCourseBySlug('hvac-technician');

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Course data not available.</p>
      </div>
    );
  }

  // Fetch user auth + enrollment + progress
  const user = await getCurrentUser();
  let enrollmentStatus: 'not-enrolled' | 'enrolled' | 'in-progress' | 'completed' = 'not-enrolled';
  let completedLessonIds: string[] = [];
  let progressPercent = 0;
  let lastLessonId: string | null = null;
  let lastLessonTitle: string | null = null;
  let totalTimeSeconds = 0;
  let enrollmentData: any = null;

  if (user) {
    try {
      const db = createAdminClient();

      // Check enrollment (by course_id or program_id)
      const { data: enrollment } = await db
        .from('program_enrollments')
        .select('*')
        .eq('user_id', user.id)
        .or(`course_id.eq.${HVAC_COURSE_ID},program_id.eq.${HVAC_PROGRAM_ID}`)
        .maybeSingle();

      if (enrollment) {
        enrollmentData = enrollment;
        enrollmentStatus = enrollment.status === 'completed' ? 'completed' : 'enrolled';
      }

      // Check lesson progress
      const { data: lessonProgress } = await db
        .from('lesson_progress')
        .select('lesson_id, completed, completed_at, time_spent_seconds')
        .eq('user_id', user.id);

      if (lessonProgress && lessonProgress.length > 0) {
        completedLessonIds = lessonProgress
          .filter((p: any) => p.completed)
          .map((p: any) => p.lesson_id);

        totalTimeSeconds = lessonProgress.reduce(
          (sum: number, p: any) => sum + (p.time_spent_seconds || 0), 0
        );

        if (enrollmentStatus === 'enrolled' && completedLessonIds.length > 0) {
          enrollmentStatus = 'in-progress';
        }

        // Find last accessed lesson
        const sorted = lessonProgress
          .filter((p: any) => p.completed_at)
          .sort((a: any, b: any) =>
            new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
          );
        if (sorted.length > 0) {
          lastLessonId = sorted[0].lesson_id;
        }
      }

      // Calculate progress from total lessons in DB
      const { data: allLessons } = await db
        .from('training_lessons')
        .select('id, title')
        .eq('course_id', HVAC_COURSE_ID);

      if (allLessons && allLessons.length > 0) {
        progressPercent = Math.round((completedLessonIds.length / allLessons.length) * 100);
        if (lastLessonId) {
          const found = allLessons.find((l: any) => l.id === lastLessonId);
          if (found) lastLessonTitle = found.title;
        }
      }
    } catch {
      // Non-fatal — render page without progress data
    }
  }

  return (
    <HvacCourseViewer
      course={course}
      isAuthenticated={!!user}
      userName={user?.profile?.full_name || null}
      enrollmentStatus={enrollmentStatus}
      enrollmentData={enrollmentData}
      completedLessonIds={completedLessonIds}
      progressPercent={progressPercent}
      lastLessonId={lastLessonId}
      lastLessonTitle={lastLessonTitle}
      totalTimeSeconds={totalTimeSeconds}
    />
  );
}
