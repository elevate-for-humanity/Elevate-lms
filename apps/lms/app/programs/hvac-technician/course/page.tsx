import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { resolveCourseEnrollment } from '@/lib/enrollment/resolve-course-enrollment';
import { getCurrentUser } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  INSTRUCTOR_CURRICULUM_IP_DOCUMENT_URL,
  getInstructorCurriculumLicenseStatus,
} from '@/lib/legal/instructorCurriculumLicense';
import CanonicalHvacCourseHome from './CanonicalHvacCourseHome';
import { findPublishedHvacCourseId } from '@/lib/courses/resolvers';
import { loadCourseActivity } from '@/lib/learner/course-activity';
import { getHvacSimulationDefinition } from '@/lib/lms/hvac-course-simulations';
import { HVAC_COURSE_ID } from '@/lib/lms/hvac-workbook-contract';

const INSTRUCTOR_LICENSE_DENIALS: Record<string, string> = {
  unsigned:
    'You have not signed the current Proprietary Curriculum and Authorized Instructor License.',
  stale_version:
    'A newer version of the instructor license agreement is published. Sign the current version to continue.',
  hash_mismatch:
    'The published instructor license agreement changed. Sign the current version to continue.',
  no_license:
    'Your instructor license is not active. Sign the current agreement to activate it.',
  revoked:
    'Your instructor license was revoked. Contact Elevate to renew your teaching authorization.',
  no_assignment: 'You are not assigned to teach this course.',
  unavailable: 'Your instructor license could not be verified right now. Try again later.',
};

function InstructorLicenseRequired({
  reason,
  version,
}: {
  reason: string;
  version: string;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-24">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">Instructor license required</h1>
        <p className="mt-3 text-slate-700">
          {INSTRUCTOR_LICENSE_DENIALS[reason] ??
            'Your instructor license could not be verified.'}
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Teaching this course requires the current Proprietary Curriculum and Authorized
          Instructor License (version {version}). The general instructor services agreement
          does not satisfy this requirement.
        </p>
        <Link
          href={INSTRUCTOR_CURRICULUM_IP_DOCUMENT_URL}
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-cyan-800 px-5 py-3 font-bold text-white"
        >
          Read and sign the instructor license agreement
        </Link>
      </div>
    </main>
  );
}

export const metadata: Metadata = {
  title: 'HVAC Technician Course',
  description:
    'HVAC technician training with EPA Section 608 preparation, safety, diagnostics, and hands-on learning.',
};

export const dynamic = 'force-dynamic';

export default async function HvacCoursePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/programs/hvac-technician/course');

  const db = await requireAdminClient();
  const activeCourseId = await findPublishedHvacCourseId();
  const { data: course, error: courseError } = activeCourseId
    ? await db
        .from('courses')
        .select('id, title, description, slug, is_active')
        .eq('id', activeCourseId)
        .eq('is_active', true)
        .eq('status', 'published')
        .maybeSingle()
    : { data: null, error: null };

  if (courseError) {
    throw new Error(`HVAC_COURSE_LOOKUP_FAILED:${courseError.message}`);
  }
  if (!course) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-24">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">HVAC course is not published yet</h1>
          <p className="mt-3 text-slate-700">
            Course materials will be available here after the course is published.
          </p>
        </div>
      </main>
    );
  }

  const accessStatuses = ['active', 'enrolled', 'in_progress', 'confirmed', 'completed'];
  const enrollment = await resolveCourseEnrollment(user.id, course.id);
  let instructorLicenseRef: string | null = null;
  if (!enrollment || !accessStatuses.includes(enrollment.status)) {
    // The paid digital bundle grants access to this course on its own.
    const { data: directEnrollment, error: directEnrollmentError } = await db
      .from('course_enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', course.id)
      .in('status', accessStatuses)
      .is('revoked_at', null)
      .limit(1)
      .maybeSingle();
    if (directEnrollmentError) throw new Error('HVAC_COURSE_ENROLLMENT_UNAVAILABLE');
    if (!directEnrollment) {
      // Instructor entitlement: a licensed instructor assigned to teach this
      // course may view it to teach, without a learner enrollment. Anyone
      // else without enrollment gets the same 404 as before.
      const { data: instructorProfile } = await db
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (instructorProfile?.role !== 'instructor') notFound();
      const licenseStatus = await getInstructorCurriculumLicenseStatus(db, user.id, {
        courseId: course.id,
      });
      if (!licenseStatus.authorized) {
        return (
          <InstructorLicenseRequired
            reason={licenseStatus.reason}
            version={licenseStatus.agreementVersion}
          />
        );
      }
      instructorLicenseRef = licenseStatus.licenseReference;
    }
  }

  const [{ data: modules, error: modulesError }, { data: lessons, error: lessonsError }] =
    await Promise.all([
      db
        .from('course_modules')
        .select('id, title, description, order_index')
        .eq('course_id', course.id)
        .eq('is_published', true)
        .order('order_index', { ascending: true }),
      db
        .from('course_lessons')
        .select('id, module_id, title, lesson_type, duration_minutes, order_index, is_published')
        .eq('course_id', course.id)
        .eq('is_published', true)
        .order('order_index', { ascending: true }),
    ]);

  if (modulesError) throw new Error(`HVAC_MODULES_FAILED:${modulesError.message}`);
  if (lessonsError) throw new Error(`HVAC_LESSONS_FAILED:${lessonsError.message}`);

  const simulationDb = course.id === HVAC_COURSE_ID ? await createClient() : null;
  const { data: simulationProgress, error: simulationProgressError } = simulationDb
    ? await simulationDb
        .from('interaction_progress')
        .select('lesson_id,interaction_id,completed,attempts')
        .eq('learner_id', user.id)
        .eq('course_id', course.id)
        .eq('interaction_type', 'simulation')
        .like('interaction_id', 'hvac-sim:%')
    : { data: [], error: null };
  if (simulationProgressError) throw new Error('HVAC_SIMULATION_PROGRESS_UNAVAILABLE');

  const simulationForLesson = (lessonId: string) => {
    const definition = course.id === HVAC_COURSE_ID ? getHvacSimulationDefinition(lessonId) : null;
    if (!definition) return undefined;
    const saved = simulationProgress?.find(
      (row) => row.lesson_id === lessonId && row.interaction_id === definition.id,
    );
    return {
      id: definition.id,
      title: definition.title,
      mastered: saved?.completed === true,
      started: Number(saved?.attempts ?? 0) > 0,
    };
  };

  const moduleModels = (modules ?? []).map((module) => ({
    id: String(module.id),
    title: String(module.title ?? 'Module'),
    description: module.description ? String(module.description) : null,
    orderIndex: Number(module.order_index ?? 0),
    lessons: (lessons ?? [])
      .filter((lesson) => String(lesson.module_id) === String(module.id))
      .map((lesson) => ({
        id: String(lesson.id),
        title: String(lesson.title ?? 'Lesson'),
        lessonType: String(lesson.lesson_type ?? 'lesson'),
        durationMinutes: lesson.duration_minutes == null ? null : Number(lesson.duration_minutes),
        orderIndex: Number(lesson.order_index ?? 0),
        simulation: simulationForLesson(String(lesson.id)),
      }))
      .sort((a, b) => a.orderIndex - b.orderIndex),
  }));

  let completedLessonIds: string[] = [];
  let totalTimeSeconds = 0;
  const { data: progress, error: progressError } = await db
    .from('lesson_progress')
    .select('lesson_id, completed, time_spent_seconds')
    .eq('user_id', user.id)
    .eq('course_id', course.id);

  if (progressError) throw new Error('HVAC_PROGRESS_UNAVAILABLE');
  const publishedIds = new Set((lessons ?? []).map((lesson) => String(lesson.id)));
  const savedActivity = await loadCourseActivity(db, user.id, course.id, [...publishedIds]);
  if (progress) {
    const publishedProgress = progress.filter((row) => publishedIds.has(String(row.lesson_id)));
    completedLessonIds = publishedProgress
      .filter((row) => row.completed === true && row.lesson_id)
      .map((row) => String(row.lesson_id));
    totalTimeSeconds = publishedProgress.reduce(
      (sum, row) => sum + Number(row.time_spent_seconds ?? 0),
      0,
    );
  }

  return (
    <CanonicalHvacCourseHome
      courseId={String(course.id)}
      title={String(course.title ?? 'HVAC Technician')}
      description={course.description ? String(course.description) : null}
      modules={moduleModels}
      completedLessonIds={completedLessonIds}
      totalTimeSeconds={totalTimeSeconds}
      savedActivity={savedActivity}
      instructorLicenseRef={instructorLicenseRef}
    />
  );
}
