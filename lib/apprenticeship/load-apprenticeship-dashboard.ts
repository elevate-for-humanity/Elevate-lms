import { loadPublishedLessonProgress } from './published-lesson-progress';
import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { loadApprenticePortalData } from '@/lib/portal/load-apprentice-portal';
import { resolveCourseIdFromDb } from '@/lib/course-builder/program-resolver';
import {
  complianceLinksForProgram,
  getProgramDashboardExtras,
  type ProgramDashboardExtras,
} from '@/lib/apprenticeship/program-dashboard-extras';
import { resolveCourseEntryLinks } from '@/lib/lms/resolve-course-entry-links';

export interface RtiTrainingSummary {
  courseId: string;
  courseTitle: string;
  courseHref: string;
  workbookHref: string;
  continueHref: string;
  progressPercent: number;
  status: string | null;
  publishedLessonCount: number;
  completedLessonCount: number;
  lastActivityAt: string | null;
}

export type ApprenticeshipDashboardData = Awaited<ReturnType<typeof loadApprenticePortalData>> & {
  extras: ProgramDashboardExtras;
  complianceLinks: { label: string; href: string }[];
  rti: RtiTrainingSummary | null;
};

export async function loadApprenticeshipDashboard(
  programSlug: string,
): Promise<ApprenticeshipDashboardData> {
  const base = await loadApprenticePortalData(programSlug);
  const extras = getProgramDashboardExtras(programSlug);
  const complianceLinks = complianceLinksForProgram(programSlug);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ...base, extras, complianceLinks, rti: null };
  }

  const courseId =
    (await resolveCourseIdFromDb(supabase, programSlug)) ||
    (base.enrollment as any)?.course_id ||
    null;
  if (!courseId) {
    return { ...base, extras, complianceLinks, rti: null };
  }

  // Rendering a dashboard must not grant access, reactivate enrollments,
  // or overwrite completed LMS progress. Onboarding owns those transitions.

  const [courseResult, lmsProgressResult, lessonProgress, entryLinks] =
    await Promise.all([
    supabase.from('lms_courses').select('id, title').eq('id', courseId).maybeSingle(),
    supabase
      .from('lms_progress')
      .select('progress_percent, status, last_activity_at')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle(),
    loadPublishedLessonProgress(supabase, courseId, user.id),
    resolveCourseEntryLinks(supabase, courseId, user.id),
  ]);

  if (courseResult.error) throw courseResult.error;
  if (lmsProgressResult.error) throw lmsProgressResult.error;
  const course = courseResult.data;
  const lmsProgress = lmsProgressResult.data;
  const publishedLessonCount = lessonProgress.totalLessons;
  const completedLessonCount = lessonProgress.completedLessons;

  const rti: RtiTrainingSummary = {
    courseId,
    courseTitle: course?.title ?? extras.rtiCourseTitle ?? base.config.label,
    courseHref: entryLinks.courseHref,
    workbookHref: entryLinks.workbookHref,
    continueHref: entryLinks.continueHref,
    progressPercent: lessonProgress.percent,
    status: lmsProgress?.status ?? (completedLessonCount > 0 ? 'in_progress' : null),
    publishedLessonCount,
    completedLessonCount,
    lastActivityAt: lmsProgress?.last_activity_at ?? null,
  };

  return { ...base, extras, complianceLinks, rti };
}
