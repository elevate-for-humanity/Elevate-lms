import { Metadata } from 'next';
import { getCourseBySlug } from '@/lib/courses/definitions';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import HvacCourseHome from './HvacCourseHome';
import { HVAC_COURSE_ID, HVAC_PROGRAM_ID } from '@/lib/courses/hvac-uuids';

export const metadata: Metadata = {
  title: 'HVAC Technician Course | Elevate for Humanity',
  description: 'HVAC Technician: 16 modules, 94 lessons. EPA 608, OSHA 30, hands-on labs.',
};

export const dynamic = 'force-dynamic';

export default async function HvacCoursePage() {
  const course = getCourseBySlug('hvac-technician');
  if (!course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-600">Course data not available.</p>
      </div>
    );
  }

  let completedLessonIds: string[] = [];
  let lastLessonId: string | null = null;
  let lastLessonTitle: string | null = null;
  let totalTimeSeconds = 0;

  const user = await getCurrentUser();
  if (user) {
    try {
      const db = createAdminClient();
      const { data: progress } = await db
        .from('lesson_progress')
        .select('lesson_id, completed, completed_at, time_spent_seconds')
        .eq('user_id', user.id);

      if (progress && progress.length > 0) {
        completedLessonIds = progress.filter((p: any) => p.completed).map((p: any) => p.lesson_id);
        totalTimeSeconds = progress.reduce((s: number, p: any) => s + (p.time_spent_seconds || 0), 0);

        const last = progress
          .filter((p: any) => p.completed_at)
          .sort((a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];
        if (last) lastLessonId = last.lesson_id;
      }

      // Get title for last lesson
      if (lastLessonId) {
        const { data: lessonRow } = await db
          .from('training_lessons')
          .select('title')
          .eq('id', lastLessonId)
          .maybeSingle();
        if (lessonRow) lastLessonTitle = lessonRow.title;
      }
    } catch {
      // Non-fatal
    }
  }

  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const progressPercent = totalLessons > 0 ? Math.round((completedLessonIds.length / totalLessons) * 100) : 0;

  return (
    <HvacCourseHome
      course={course}
      completedLessonIds={completedLessonIds}
      progressPercent={progressPercent}
      userId={user?.id || null}
      lastLessonId={lastLessonId}
      lastLessonTitle={lastLessonTitle}
      totalTimeSeconds={totalTimeSeconds}
    />
  );
}
