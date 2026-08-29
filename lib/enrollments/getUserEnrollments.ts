/**
 * Unified enrollment resolver for learner dashboards.
 *
 * Program access is sourced from program_enrollments. Direct course assignments
 * are sourced from course_enrollments and de-duplicated by course id.
 * Partner LMS access remains separate because it is a different delivery concern.
 * Legacy training_enrollments / student_enrollments aliases are intentionally not
 * queried here; compatibility surfaces must never become a second authority.
 */

import { createClient } from '@/lib/supabase/server';
import {
  resolveDeliveryMode,
  getContinueLearningUrl,
  type DeliveryMode,
  type EnrollmentSource,
} from '@/lib/delivery/resolveDeliveryMode';

export type NormalizedEnrollment = {
  source_table: EnrollmentSource;
  enrollment_id: string;
  user_key: string;
  program_id: string | null;
  program_slug: string | null;
  program_title: string | null;
  course_id: string | null;
  course_title: string | null;
  course_description: string | null;
  duration_hours: number | null;
  provider_id: string | null;
  provider_name: string | null;
  status: string;
  progress: number;
  delivery_mode: DeliveryMode;
  inferred_delivery_mode: boolean;
  continue_url: string;
  created_at: string;
  updated_at: string | null;
};

export type EnrollmentQueryResult = {
  enrollments: NormalizedEnrollment[];
  error: string | null;
};

type ProgramRow = {
  id: string;
  slug: string | null;
  name: string | null;
  title: string | null;
  delivery_mode: DeliveryMode | null;
};

type CourseRow = {
  id: string;
  title: string | null;
  course_name: string | null;
  description: string | null;
  short_description: string | null;
  duration_hours: number | null;
};

export async function getUserEnrollments(userId: string): Promise<EnrollmentQueryResult> {
  const supabase = await createClient();
  if (!supabase) return { enrollments: [], error: 'Database not configured' };

  const results: NormalizedEnrollment[] = [];

  const { data: programEnrollments, error: programEnrollmentError } = await supabase
    .from('program_enrollments')
    .select(
      'id,user_id,student_id,course_id,program_id,program_slug,status,progress_percent,created_at,updated_at',
    )
    .or(`user_id.eq.${userId},student_id.eq.${userId}`);

  if (programEnrollmentError) {
    return { enrollments: [], error: programEnrollmentError.message };
  }

  const programIds = [
    ...new Set((programEnrollments ?? []).map((row) => row.program_id).filter(Boolean)),
  ] as string[];
  const courseIds = [
    ...new Set((programEnrollments ?? []).map((row) => row.course_id).filter(Boolean)),
  ] as string[];

  const [programResult, courseResult] = await Promise.all([
    programIds.length
      ? supabase
          .from('programs')
          .select('id,slug,name,title,delivery_mode')
          .in('id', programIds)
      : Promise.resolve({ data: [] as ProgramRow[], error: null }),
    courseIds.length
      ? supabase
          .from('courses')
          .select('id,title,course_name,description,short_description,duration_hours')
          .in('id', courseIds)
      : Promise.resolve({ data: [] as CourseRow[], error: null }),
  ]);

  if (programResult.error) {
    return { enrollments: [], error: programResult.error.message };
  }
  if (courseResult.error) {
    return { enrollments: [], error: courseResult.error.message };
  }

  const programsById = new Map<string, ProgramRow>(
    ((programResult.data ?? []) as ProgramRow[]).map((program) => [program.id, program]),
  );
  const coursesById = new Map<string, CourseRow>(
    ((courseResult.data ?? []) as CourseRow[]).map((course) => [course.id, course]),
  );

  for (const row of programEnrollments ?? []) {
    const program = row.program_id ? programsById.get(row.program_id) ?? null : null;
    const course = row.course_id ? coursesById.get(row.course_id) ?? null : null;
    const { mode, inferred } = resolveDeliveryMode('program_enrollments', program);
    const userKey = row.user_id || row.student_id;
    if (!userKey) continue;

    const enrollment: NormalizedEnrollment = {
      source_table: 'program_enrollments',
      enrollment_id: row.id,
      user_key: userKey,
      program_id: row.program_id ?? null,
      program_slug: program?.slug ?? row.program_slug ?? null,
      program_title:
        program?.title ?? program?.name ?? (row.program_slug ? formatProgramSlug(row.program_slug) : null),
      course_id: row.course_id ?? null,
      course_title: course?.title ?? course?.course_name ?? null,
      course_description: course?.description ?? course?.short_description ?? null,
      duration_hours: course?.duration_hours ?? null,
      provider_id: null,
      provider_name: null,
      status: row.status || 'active',
      progress: Number(row.progress_percent ?? 0),
      delivery_mode: mode,
      inferred_delivery_mode: inferred,
      continue_url: '',
      created_at: row.created_at,
      updated_at: row.updated_at ?? null,
    };
    enrollment.continue_url = getContinueLearningUrl(mode, enrollment);
    results.push(enrollment);
  }

  const { data: courseEnrollments, error: courseEnrollmentError } = await supabase
    .from('course_enrollments')
    .select('id,student_id,course_id,status,progress,created_at,updated_at')
    .eq('student_id', userId);

  if (courseEnrollmentError) return { enrollments: results, error: courseEnrollmentError.message };

  const directCourseIds = [...new Set((courseEnrollments ?? []).map((row) => row.course_id).filter(Boolean))] as string[];
  const missingCourseIds = directCourseIds.filter((id) => !coursesById.has(id));
  if (missingCourseIds.length) {
    const { data: directCourses, error: directCoursesError } = await supabase
      .from('courses')
      .select('id,title,course_name,description,short_description,duration_hours')
      .in('id', missingCourseIds);
    if (directCoursesError) return { enrollments: results, error: directCoursesError.message };
    for (const course of (directCourses ?? []) as CourseRow[]) coursesById.set(course.id, course);
  }

  const representedCourseIds = new Set(results.map((item) => item.course_id).filter(Boolean));
  for (const row of courseEnrollments ?? []) {
    if (!row.course_id || representedCourseIds.has(row.course_id)) continue;
    const course = coursesById.get(row.course_id) ?? null;
    results.push({
      source_table: 'course_enrollments', enrollment_id: row.id, user_key: row.student_id,
      program_id: null, program_slug: null, program_title: null, course_id: row.course_id,
      course_title: course?.title ?? course?.course_name ?? null,
      course_description: course?.description ?? course?.short_description ?? null,
      duration_hours: course?.duration_hours ?? null, provider_id: null, provider_name: null,
      status: row.status || 'active', progress: Number(row.progress ?? 0), delivery_mode: 'internal',
      inferred_delivery_mode: false, continue_url: `/lms/courses/${row.course_id}`,
      created_at: row.created_at, updated_at: row.updated_at ?? null,
    });
    representedCourseIds.add(row.course_id);
  }

  const { data: partnerEnrollments, error: partnerError } = await supabase
    .from('partner_lms_enrollments')
    .select(
      'id,student_id,course_id,provider_id,status,progress_percentage,enrolled_at,created_at,updated_at,metadata',
    )
    .eq('student_id', userId);

  if (partnerError) {
    return { enrollments: results, error: partnerError.message };
  }

  const partnerCourseIds = [...new Set((partnerEnrollments ?? []).map((row) => row.course_id).filter((id): id is string => Boolean(id)))];
  const partnerProviderIds = [...new Set((partnerEnrollments ?? []).map((row) => row.provider_id).filter((id): id is string => Boolean(id)))];
  const [partnerCoursesResult, partnerProvidersResult] = await Promise.all([
    partnerCourseIds.length
      ? supabase.from('partner_lms_courses').select('id,course_name,course_description,description,duration_hours').in('id', partnerCourseIds)
      : Promise.resolve({ data: [], error: null }),
    partnerProviderIds.length
      ? supabase.from('partner_lms_providers').select('id,provider_name,website_url').in('id', partnerProviderIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const partnerCoursesById = new Map<string, any>(
    (partnerCoursesResult.data ?? []).map((course: any) => [course.id, course]),
  );
  const partnerProvidersById = new Map<string, any>(
    (partnerProvidersResult.data ?? []).map((provider: any) => [provider.id, provider]),
  );

  const internalFallbackCourseIds = partnerCourseIds.filter((id) => !partnerCoursesById.has(id) && !coursesById.has(id));
  if (internalFallbackCourseIds.length) {
    const { data: partnerCourseFallbacks } = await supabase
      .from('courses')
      .select('id,title,course_name,description,short_description,duration_hours')
      .in('id', internalFallbackCourseIds);
    for (const course of (partnerCourseFallbacks ?? []) as CourseRow[]) coursesById.set(course.id, course);
  }

  for (const row of partnerEnrollments ?? []) {
    const course = row.course_id ? partnerCoursesById.get(row.course_id) ?? null : null;
    const provider = row.provider_id ? partnerProvidersById.get(row.provider_id) ?? null : null;
    const internalCourse = row.course_id ? coursesById.get(row.course_id) ?? null : null;
    const { mode, inferred } = resolveDeliveryMode('partner_lms_enrollments', null);
    const enrollment: NormalizedEnrollment = {
      source_table: 'partner_lms_enrollments',
      enrollment_id: row.id,
      user_key: row.student_id,
      program_id: null,
      program_slug: null,
      program_title: course?.course_name || internalCourse?.title || internalCourse?.course_name || (row.metadata as any)?.credential || null,
      course_id: row.course_id || course?.id || null,
      course_title: course?.course_name || internalCourse?.title || internalCourse?.course_name || (row.metadata as any)?.credential || null,
      course_description: course?.course_description || course?.description || internalCourse?.description || internalCourse?.short_description || null,
      duration_hours: course?.duration_hours ?? internalCourse?.duration_hours ?? null,
      provider_id: row.provider_id || provider?.id || null,
      provider_name: provider?.provider_name || null,
      status: row.status || 'active',
      progress: Number(row.progress_percentage ?? 0),
      delivery_mode: mode,
      inferred_delivery_mode: inferred,
      continue_url: '',
      created_at: row.enrolled_at || row.created_at,
      updated_at: row.updated_at,
    };
    enrollment.continue_url = getContinueLearningUrl(mode, enrollment);
    results.push(enrollment);
  }

  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return { enrollments: results, error: null };
}

function formatProgramSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function getActiveEnrollments(userId: string): Promise<EnrollmentQueryResult> {
  const result = await getUserEnrollments(userId);
  if (result.error) return result;

  const activeStatuses = new Set(['active', 'enrolled', 'in_progress', 'pending']);
  return {
    enrollments: result.enrollments.filter((enrollment) =>
      activeStatuses.has(enrollment.status.toLowerCase()),
    ),
    error: null,
  };
}
