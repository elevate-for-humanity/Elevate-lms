import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { loadApprenticePortalData } from '@/lib/portal/load-apprentice-portal';
import { resolveCourseIdFromDb } from '@/lib/course-builder/program-resolver';
import {
  complianceLinksForProgram,
  getProgramDashboardExtras,
  type ProgramDashboardExtras,
} from '@/lib/apprenticeship/program-dashboard-extras';
import { ensureBarberLmsEnrollment } from '@/lib/barber/ensure-lms-enrollment';
import { BARBER_PROGRAM_SLUG } from '@/lib/barber/constants';
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

  const courseId = await resolveCourseIdFromDb(supabase, programSlug);
  if (!courseId) {
    return { ...base, extras, complianceLinks, rti: null };
  }

  if (programSlug === BARBER_PROGRAM_SLUG && base.enrollment) {
    const adminDb = await getAdminClient();
    await ensureBarberLmsEnrollment(adminDb ?? supabase, user.id, {
      grantAccess: Boolean(base.enrollment.orientation_completed_at),
    });
  }

  const [{ data: course }, { data: lmsProgress }, lessonCountRes, completedRes, entryLinks] =
    await Promise.all([
    supabase.from('courses').select('id, title').eq('id', courseId).maybeSingle(),
    supabase
      .from('lms_progress')
      .select('progress_percent, status, last_activity_at')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle(),
    supabase
      .from('course_lessons')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId),
    supabase
      .from('lesson_progress')
      .select('lesson_id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('completed', true),
    resolveCourseEntryLinks(supabase, courseId, user.id),
  ]);

  const publishedLessonCount = lessonCountRes.count ?? 0;
  const completedLessonCount = completedRes.count ?? 0;
  const progressFromRows =
    publishedLessonCount > 0
      ? Math.round((completedLessonCount / publishedLessonCount) * 100)
      : 0;

  const rti: RtiTrainingSummary = {
    courseId,
    courseTitle: course?.title ?? extras.rtiCourseTitle ?? base.config.label,
    courseHref: entryLinks.courseHref,
    workbookHref: entryLinks.workbookHref,
    continueHref: entryLinks.continueHref,
    progressPercent: lmsProgress?.progress_percent ?? progressFromRows,
    status: lmsProgress?.status ?? (completedLessonCount > 0 ? 'in_progress' : null),
    publishedLessonCount,
    completedLessonCount,
    lastActivityAt: lmsProgress?.last_activity_at ?? null,
  };

  return { ...base, extras, complianceLinks, rti };
}
