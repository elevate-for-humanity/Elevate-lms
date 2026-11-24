import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { v5 as uuidv5 } from 'uuid';
import { buildUltimateProfile } from './course-profile';
import { resolveCourseProgramSlug } from './course-program-identity';
import { GOOGLE_LESSON_AUTHOR_VERSION } from '../instructional/google-lesson-author';

type PrepareCourseInput = {
  courseId?: string;
  programSlug?: string;
  instructionalAuthoring?: { provider: string; model: string; location?: string };
};

const BUILD_COLUMNS = 'id,course_id,status,current_step,profile,created_at,updated_at';

/** Save source-review inputs only. An explicit Start must unpause and enqueue production. */
export async function prepareCanonicalCourse(
  db: SupabaseClient,
  body: PrepareCourseInput,
  actorId: string,
) {
  const courseId = typeof body.courseId === 'string' ? body.courseId.trim() : '';
  if (!courseId)
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 });

  const authoring = body.instructionalAuthoring;
  if (
    authoring &&
    (authoring.provider !== 'google' ||
      !/^gemini-[a-z0-9.-]+$/.test(authoring.model || '') ||
      (authoring.location && !['us', 'eu', 'global', 'us-central1'].includes(authoring.location)))
  )
    return NextResponse.json(
      { error: 'Google authoring requires an explicitly selected Gemini model' },
      { status: 400 },
    );

  const { data: course, error: courseError } = await db
    .from('courses')
    .select('id,title,slug,description,program_id')
    .eq('id', courseId)
    .maybeSingle();
  if (courseError) throw courseError;
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

  const programSlug = await resolveCourseProgramSlug(db, course, body.programSlug);
  if (!programSlug)
    return NextResponse.json({ error: 'programSlug is required' }, { status: 400 });

  const response = (build: Record<string, unknown>, reused: boolean) =>
    NextResponse.json({ ok: true, buildId: build.id, build, reused, queued: false, dispatched: false });
  const existing = await db
    .from('ultimate_course_builds')
    .select(BUILD_COLUMNS)
    .eq('course_id', course.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return response(existing.data, true);

  const generatedProfile = await buildUltimateProfile(db, {
    courseId: course.id,
    programSlug,
    title: course.title,
    topic: course.description ?? '',
  });
  const { data: lessons, error: lessonError } = await db
    .from('course_lessons')
    .select('id')
    .eq('course_id', course.id);
  if (lessonError) throw lessonError;
  const lessonIds = new Set((lessons ?? []).map((lesson) => lesson.id));
  const canonicalLessonIds = { ...generatedProfile.canonicalLessonIds };
  for (const competency of generatedProfile.competencies) {
    if (lessonIds.has(competency.id)) canonicalLessonIds[competency.id] = competency.id;
  }

  // Repeated or concurrent preparation must not create competing source containers.
  const buildId = uuidv5(`ultimate-course-preparation:${course.id}`, uuidv5.URL);
  const created = await db
    .from('ultimate_course_builds')
    .insert({
      id: buildId,
      course_id: course.id,
      profile: {
        ...generatedProfile,
        canonicalLessonIds,
        ownerPaused: true,
        mediaAcquisitionOwnerId: actorId,
        ...(authoring ? {
          instructionalAuthoring: {
            provider: 'google',
            model: authoring.model,
            ...(authoring.location ? { location: authoring.location } : {}),
            version: GOOGLE_LESSON_AUTHOR_VERSION,
          },
        } : {}),
      },
      status: 'initializing',
      current_step: 'standards_lock',
      findings: [],
    })
    .select(BUILD_COLUMNS)
    .single();
  if (created.error?.code === '23505') {
    const concurrent = await db.from('ultimate_course_builds').select(BUILD_COLUMNS)
      .eq('id', buildId).eq('course_id', course.id).single();
    if (concurrent.error || !concurrent.data) throw concurrent.error ?? created.error;
    return response(concurrent.data, true);
  }
  if (created.error || !created.data)
    throw created.error ?? new Error('ULTIMATE_BUILD_PREPARATION_FAILED');
  return response(created.data, false);
}
