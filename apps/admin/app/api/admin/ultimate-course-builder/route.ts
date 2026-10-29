import { inheritCourseProductionPolicy } from '@/lib/ultimate-course-builder/core/production-policy.mjs';
import {loadCheckpointPage} from '@/lib/ultimate-course-builder/queries/checkpoint-page.mjs';
import { loadUltimateBuildPage, parseBuildListPage } from '@/lib/ultimate-course-builder/queries/build-list-page';
import { recordCourseDispatch } from '@/lib/ultimate-course-builder/worker/dispatch-evidence';
import { applySyllabusPlan, validateSyllabusPlan } from '@/lib/ultimate-course-builder/authoring/syllabus-plan';
import { logger } from '@/lib/logger';
import { ULTIMATE_LESSON_CONTRACT_VERSION } from '@/lib/ultimate-course-builder/core/lesson-contract';
import { validateLessonBlueprint } from '@/lib/ultimate-course-builder/instructional/lesson-blueprint';
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { UltimateJobQueue } from '@/lib/ultimate-course-builder/worker/job-queue';
import { requestCourseWorker } from '@/lib/gcp/course-worker-launch';
import { safeInternalError } from '@/lib/api/safe-error';
import { buildUltimateProfile } from '@/lib/ultimate-course-builder/core/course-profile';
import { GOOGLE_LESSON_AUTHOR_VERSION } from '@/lib/ultimate-course-builder/instructional/google-lesson-author';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function databaseFailure(error: unknown, status = 500) {
  logger.error('Ultimate Course Builder database operation failed', error);
  return NextResponse.json(
    { error: 'Course Builder operation failed. Check the server audit log.' },
    { status },
  );
}

export async function GET(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const db = await requireAdminClient();
  const acquisitionRunId = req.nextUrl.searchParams.get('acquisitionRunId')?.trim();
  if (acquisitionRunId) {
    const { data: run, error } = await db
      .from('studio_runs')
      .select('id,command,context,course_id')
      .eq('id', acquisitionRunId)
      .eq('user_id', auth.id)
      .single();
    if (error || !run)
      return NextResponse.json({ error: 'Media acquisition request not found' }, { status: 404 });
    return NextResponse.json({ acquisition: run });
  }
  const buildId = req.nextUrl.searchParams.get('buildId')?.trim();
  const courseId = req.nextUrl.searchParams.get('courseId')?.trim();

  if (buildId) {
    if(req.nextUrl.searchParams.get('view')==='checkpoints'){
      try{return NextResponse.json({build:await loadCheckpointPage(db,buildId,req.nextUrl.searchParams.get('lessonId')??'')});}
      catch(error){return databaseFailure(error);}
    }
    const {data,error}=await db.from('ultimate_course_builds')
      .select('*,ultimate_lesson_builds(*,ultimate_lesson_steps(*))').eq('id',buildId).single();
    return error?databaseFailure(error):NextResponse.json({build:data});
  }

  const page = parseBuildListPage(req.nextUrl.searchParams.get('page'));
  if (page === null) return NextResponse.json({ error: 'page must be an integer from 1 to 10000' }, { status: 400 });
  const { data, error, pagination } = await loadUltimateBuildPage(db, courseId, page);
  if (error) return databaseFailure(error);
  let acquisitions: Array<{ id: string; goal: string | null }> = [];
  if (courseId) {
    const requests = await db
      .from('studio_runs')
      .select('id,goal')
      .eq('course_id', courseId)
      .eq('user_id', auth.id)
      .contains('context', { acquisition_mode: 'envato-workspace-batch' })
      .neq('status', 'completed')
      .order('updated_at', { ascending: false });
    if (requests.error) return databaseFailure(requests.error);
    acquisitions = requests.data ?? [];
  }
  return NextResponse.json({ builds: data ?? [], acquisitions, pagination });
}

export async function POST(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const db = await requireAdminClient();

  if (body.action === 'configure-contract') {
    const { data: build, error } = await db
      .from('ultimate_course_builds')
      .select('id,profile,status')
      .eq('id', body.buildId)
      .single();
    if (error || !build) return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    if (build.status === 'running')
      return NextResponse.json(
        { error: 'Stop the active job before changing its locked contract inputs' },
        { status: 409 },
      );
    const profile: any = { ...build.profile };
    if (body.lessonBlueprints) {
      if (typeof body.lessonBlueprints !== 'object' || Array.isArray(body.lessonBlueprints))
        return NextResponse.json(
          { error: 'lessonBlueprints must be keyed by competency ID' },
          { status: 400 },
        );
      for (const [id, blueprint] of Object.entries(body.lessonBlueprints)) {
        const competency = profile.competencies?.find((c: any) => c.id === id);
        if (!competency)
          return NextResponse.json({ error: `Unknown competency: ${id}` }, { status: 400 });
        try {
          validateLessonBlueprint(blueprint as any, competency);
        } catch (e) {
          logger.error('Ultimate lesson blueprint validation failed', e);
          return NextResponse.json(
            { error: 'Lesson blueprint does not satisfy the lesson contract' },
            { status: 400 },
          );
        }
      }
      profile.lessonBlueprints = { ...profile.lessonBlueprints, ...body.lessonBlueprints };
    }
    if (body.instructionalSources) {
      if (
        !Array.isArray(body.instructionalSources) ||
        !body.instructionalSources.length ||
        body.instructionalSources.some(
          (s: any) =>
            typeof s.id !== 'string' ||
            !s.id.trim() ||
            typeof s.text !== 'string' ||
            !s.text.trim(),
        )
      )
        return NextResponse.json(
          { error: 'Each instructional source needs its source ID and complete authorized text' },
          { status: 400 },
        );
      profile.instructionalSources = [...new Map([...(profile.instructionalSources ?? []), ...body.instructionalSources].map(source => [source.id, source])).values()];
    }
    profile.lessonContractVersion = ULTIMATE_LESSON_CONTRACT_VERSION;
    const saved = await db
      .from('ultimate_course_builds')
      .update({ profile, updated_at: new Date().toISOString() })
      .eq('id', build.id)
      .eq('status', build.status)
      .eq('profile', JSON.stringify(build.profile))
      .select('id')
      .single();
    if (saved.error) return databaseFailure(saved.error, 409);
    return NextResponse.json({
      ok: true,
      buildId: build.id,
      contractVersion: ULTIMATE_LESSON_CONTRACT_VERSION,
    });
  }

  if (body.action === 'create') {
    if (!body.courseId || !body.profile) {
      return NextResponse.json({ error: 'courseId and profile are required' }, { status: 400 });
    }
    const { data, error } = await db
      .from('ultimate_course_builds')
      .insert({
        course_id: body.courseId,
        profile: inheritCourseProductionPolicy({ ...body.profile, mediaAcquisitionOwnerId: auth.id }),
        status: 'initializing',
        current_step: 'standards_lock',
        findings: [],
      })
      .select('*')
      .single();
    return error ? databaseFailure(error) : NextResponse.json({ ok: true, build: data });
  }

  if (body.action === 'status') {
    const { data, error } = await db
      .from('ultimate_course_builds')
      .select('*')
      .eq('id', body.buildId)
      .single();
    return error ? databaseFailure(error) : NextResponse.json({ ok: true, build: data });
  }

  // Keep the legacy action as a compatibility alias; both actions start a worker.
  if (body.action === 'start-course' || body.action === 'queue-course') {
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

    const programSlug = String(body.programSlug || course.slug || '').trim();
    if (!programSlug) {
      return NextResponse.json({ error: 'programSlug is required' }, { status: 400 });
    }
    if (body.syllabusPlan && !validateSyllabusPlan(body.syllabusPlan))
      return NextResponse.json({error:'Review a valid syllabus curriculum before starting.'},{status:400});
    let generatedProfile = await buildUltimateProfile(db, {
      courseId: course.id,
      programSlug,
      title: String(body.title || course.title),
      topic: String(body.topic || course.description || ''),
      audience: String(body.audience || ''),
      state: String(body.state || ''),
    });
    if (body.syllabusPlan) generatedProfile = applySyllabusPlan(generatedProfile,body.syllabusPlan);
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
    const profile = {
      ...generatedProfile,
      mediaAcquisitionOwnerId: auth.id,
      publicationPolicy: 'automatic-quality-verified',
      ...(authoring
        ? {
            instructionalAuthoring: {
              provider: 'google' as const,
              model: authoring.model,
              ...(authoring.location ? { location: authoring.location } : {}),
              version: GOOGLE_LESSON_AUTHOR_VERSION,
            },
          }
        : {}),
    };

    if (body.acceptanceBuild === true && !authoring)
      return NextResponse.json(
        { error: 'A separate teaching acceptance build requires an explicit Google model' },
        { status: 400 },
      );
    const activeQuery = db
      .from('ultimate_course_builds')
      .select('id,course_id,status,current_step,profile,created_at,updated_at')
      .eq('course_id', course.id)
      .in('status', ['initializing', 'queued', 'running'])
      .order('created_at', { ascending: false })
      .limit(1);
    if (body.acceptanceBuild === true)
      activeQuery.contains('profile', { instructionalAuthoring: profile.instructionalAuthoring });
    const { data: activeBuild, error: activeError } = await activeQuery.maybeSingle();
    if (activeError) throw activeError;
    if (activeBuild && body.syllabusPlan) return NextResponse.json({error:'This course already has an active build. Attach sources in its production workspace.'},{status:409});
    if (
      activeBuild &&
      authoring &&
      JSON.stringify((activeBuild.profile as any)?.instructionalAuthoring) !==
        JSON.stringify(profile.instructionalAuthoring)
    )
      return NextResponse.json(
        {
          error:
            'The active build has different locked authoring inputs. Preserve it and use a separate acceptance build.',
        },
        { status: 409 },
      );

    let build = activeBuild;
    if (!build) {
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

    const job = await new UltimateJobQueue(db as any).enqueue(build.id, {
      requestedBy: auth.id,
    });
    if (!job)
      return NextResponse.json({ error: 'No runnable build job was saved' }, { status: 409 });
    const dispatch = await requestCourseWorker();
    const dispatchEvidenceSaved = await recordCourseDispatch(db,job.id,dispatch,auth.id);
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

  return NextResponse.json({ error: 'Unsupported Ultimate action' }, { status: 400 });
}
