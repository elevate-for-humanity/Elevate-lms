import { assertCourseBuilderGenerationEnabled } from './generation-control';
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildUltimateProfile } from './course-profile';
import { applySyllabusPlan, validateSyllabusPlan, type SyllabusPlan } from '../authoring/syllabus-plan';
import { UltimateJobQueue } from '../worker/job-queue';
import { requestCourseWorker } from '@/lib/gcp/course-worker-launch';
import { recordCourseDispatch } from '../worker/dispatch-evidence';
import { GOOGLE_LESSON_AUTHOR_VERSION } from '../instructional/google-lesson-author';
import { resolveCourseProgramSlug } from './course-program-identity';

export type StartCourseInput = {
  courseId?: string; programSlug?: string; title?: string; topic?: string;
  audience?: string; state?: string; syllabusPlan?: SyllabusPlan;
  instructionalAuthoring?: { provider: string; model: string; location?: string };
  acceptanceBuild?: boolean;
};

/** All production generation requests share saved contracts, dispatch and worker evidence. */
export async function startCanonicalCourse(db: SupabaseClient, body: StartCourseInput, actorId: string) {
    await assertCourseBuilderGenerationEnabled(db, body.courseId);
    const courseId = String(body.courseId || '').trim();
    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }
    const { data: course, error: courseError } = await db
      .from('courses')
      .select('id,title,slug,description,program_id,status')
      .eq('id', courseId)
      .maybeSingle();
    if (courseError) throw courseError;
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const reactivated = course.status === 'archived';
    if (reactivated) {
      const { error: reactivateError } = await db
        .from('courses')
        .update({
          status: 'draft',
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', course.id);
      if (reactivateError) throw reactivateError;
    }

    const programSlug = await resolveCourseProgramSlug(db, course, body.programSlug);
    if (!programSlug) {
      return NextResponse.json({ error: 'programSlug is required' }, { status: 400 });
    }
    if (body.syllabusPlan && !validateSyllabusPlan(body.syllabusPlan))
      return NextResponse.json({error:'Review a valid syllabus curriculum before starting.'},{status:400});
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
    const instructionalAuthoring = authoring ? {
      provider: 'google' as const,
      model: authoring.model,
      ...(authoring.location ? { location: authoring.location } : {}),
      version: GOOGLE_LESSON_AUTHOR_VERSION,
    } : undefined;

    if (body.acceptanceBuild === true && !authoring)
      return NextResponse.json(
        { error: 'A separate teaching acceptance build requires an explicit Google model' },
        { status: 400 },
      );
    const activeQuery = db
      .from('ultimate_course_builds')
      .select('id,course_id,status,current_step,profile,created_at,updated_at')
      .eq('course_id', course.id)
      .in('status', ['initializing', 'queued', 'running', 'blocked', 'failed', 'built_with_findings'])
      .order('created_at', { ascending: false })
      .limit(1);
    if (body.acceptanceBuild === true)
      activeQuery.contains('profile', { instructionalAuthoring });
    const { data: activeBuild, error: activeError } = await activeQuery.maybeSingle();
    if (activeError) throw activeError;
    if (activeBuild && body.syllabusPlan &&
      !activeBuild.profile?.instructionalSources?.some((source: {id: string; text: string}) =>
        source.id === 'syllabus:uploaded' && source.text === body.syllabusPlan?.text))
      return NextResponse.json({error:'This course already has an active build. Attach sources in its production workspace.'},{status:409});
    if (
      activeBuild &&
      authoring &&
      JSON.stringify((activeBuild.profile as any)?.instructionalAuthoring) !==
        JSON.stringify(instructionalAuthoring)
    )
      return NextResponse.json(
        {
          error:
            'The active build has different locked authoring inputs. Preserve it and use a separate acceptance build.',
        },
        { status: 409 },
      );

    if (activeBuild?.profile?.ownerPaused === true)
      return NextResponse.json({ error: 'This build is paused. Use its authenticated Resume action.' }, { status: 409 });
    let build = activeBuild;
    if (!build) {
      let generatedProfile = await buildUltimateProfile(db, {
        courseId: course.id,
        programSlug,
        title: String(body.title || course.title),
        topic: String(body.topic || course.description || ''),
        audience: String(body.audience || ''),
        state: String(body.state || ''),
      });
      if (body.syllabusPlan) generatedProfile = applySyllabusPlan(generatedProfile, body.syllabusPlan);
      const profile = {
        ...generatedProfile,
        mediaAcquisitionOwnerId: actorId,
        publicationPolicy: 'automatic-quality-verified',
        ...(instructionalAuthoring ? { instructionalAuthoring } : {}),
      };

      const created = await db
        .from('ultimate_course_builds')
        .insert({
          course_id: course.id,
          profile,
          status: 'initializing',
          current_step: 'standards_lock',
          findings: [],
        })
        .select('id,course_id,status,current_step,profile,created_at,updated_at')
        .single();
      if (created.error || !created.data) {
        throw created.error ?? new Error('ULTIMATE_BUILD_CREATE_FAILED');
      }
      build = created.data;
    }

    const job = await new UltimateJobQueue(db).enqueue(build.id, {
      requestedBy: actorId,
    });
    if (!job)
      return NextResponse.json({ error: 'No runnable build job was saved' }, { status: 409 });
    const dispatch = await requestCourseWorker();
    const dispatchEvidenceSaved = await recordCourseDispatch(db,job.id,dispatch,actorId);
    if (!dispatch.dispatched) {
      return NextResponse.json({
        ok: false, queued: true, dispatched: false,
        buildId: build.id, jobId: job?.id ?? null, courseId: course.id,
        error: 'Course saved but the Google worker did not start. ' +
          'Verify the Admin Google service identity and GitHub dispatch permissions.',
        dispatchError: 'dispatchError' in dispatch ? dispatch.dispatchError : 'COURSE_WORKER_LAUNCH_UNAVAILABLE',
      }, { status: 503 });
    }
    return NextResponse.json(
      {
        ok: true,
        queued: true,
        ...dispatch, dispatchEvidenceSaved,
        reused: Boolean(activeBuild),
        build,
        buildId: build.id,
        jobId: job?.id ?? null,
        courseId: course.id,
        programSlug,
        authority: 'ultimate-course-builder',
        reactivated,
      },
      { status: 202 },
    );
}
