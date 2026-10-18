import { recordCourseDispatch } from '@/lib/ultimate-course-builder/worker/dispatch-evidence';
import { applySyllabusPlan, validateSyllabusPlan } from '@/lib/ultimate-course-builder/authoring/syllabus-plan';
import { renderReview } from '@/lib/ultimate-course-builder/authoring/render-review';
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
import { adminPreviewPlaybackUrl } from '@/lib/ultimate-course-builder/media/admin-preview-url.mjs';
import { ownerApprovedPreview } from '@/lib/ultimate-course-builder/media/owner-approved-preview.mjs';
import { lessonPreview } from '@/lib/ultimate-course-builder/core/lesson-preview';
import {
  renderMediaUrl,
  renderPlaybackUrl,
} from '@/lib/ultimate-course-builder/media/playback-source.mjs';

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
    const checkpoints = req.nextUrl.searchParams.get('view') === 'checkpoints';
    // Keep each selection literal so the Supabase parser infers its actual shape.
    const result = checkpoints
      ? await db
          .from('ultimate_course_builds')
          .select(
            'id,course_id,status,profile,current_step,updated_at,ultimate_lesson_builds(id,lesson_key,competency_id,status,artifacts,ultimate_lesson_steps(step,state,findings,completed_at))',
          )
          .eq('id', buildId)
          .single()
      : await db
          .from('ultimate_course_builds')
          .select('*,ultimate_lesson_builds(*,ultimate_lesson_steps(*))')
          .eq('id', buildId)
          .single();
    const { data, error } = result;
    if (!error && data && req.nextUrl.searchParams.get('view') === 'checkpoints') {
      const lessons = await Promise.all(
        (data.ultimate_lesson_builds ?? []).map(async (lesson: any) => {
          const { artifacts, ...saved } = lesson;
          const preview = {
            ...lessonPreview(artifacts),
            historicalVersion: null as number | null,
            previousRender: false,
          };
          // Repairs invalidate dependent checkpoints, not the saved film. Recover its
          // immutable version on initial load as well as on explicit diagnostics.
          if (!preview.videoUrl) {
            const artifact = await db
              .from('ultimate_artifacts')
              .select('id')
              .eq('build_id', buildId)
              .eq('lesson_build_id', lesson.id)
              .eq('stage', 'lesson_film_render')
              .eq('artifact_type', 'stage_output')
              .maybeSingle();
            if (artifact.error) throw artifact.error;
            if (artifact.data?.id) {
              const versions = await db
                .from('ultimate_artifact_versions')
                .select('version,content')
                .eq('artifact_id', artifact.data.id)
                .order('version', { ascending: false })
                .limit(20);
              if (versions.error) throw versions.error;
              for (const version of versions.data ?? []) {
                const videoUrl =
                  renderMediaUrl(version.content?.render) ??
                  renderPlaybackUrl(version.content?.render);
                if (videoUrl) {
                  Object.assign(preview, {
                    videoUrl,
                    historicalVersion: version.version,
                    previousRender: true,
                    mediaApproved: false,
                  });
                  break;
                }
              }
            }
          }
          const review = preview.videoUrl ? await renderReview(db, buildId, lesson.id, preview.videoUrl) : null;
          const approved = await ownerApprovedPreview(db,data,lesson);
          if (preview.videoUrl) preview.videoUrl = adminPreviewPlaybackUrl(buildId, lesson.id, preview.videoUrl) + (review ? '&artifactVersionId=' + encodeURIComponent(review.artifactVersionId) : '');
          return { ...saved, preview: {...preview,review,...(approved?{
            approvedVideoUrl:adminPreviewPlaybackUrl(buildId,lesson.id,approved.videoUrl)+'&kind=approved',
            approvedVersion:approved.version,
          }:{})} };
        }),
      ).catch((error) => {
        logger.error('Saved lesson preview recovery failed', error);
        return null;
      });
      if (!lessons) return databaseFailure(new Error('Saved preview recovery failed'));
      return NextResponse.json({ build: { ...data, ultimate_lesson_builds: lessons } });
    }
    return error ? databaseFailure(error) : NextResponse.json({ build: data });
  }

  let query = db
    .from('ultimate_course_builds')
    .select(
      'id,course_id,status,owner_paused:profile->ownerPaused,current_step,created_at,updated_at,ultimate_build_jobs(id,status,last_error,created_at,updated_at,heartbeat_at,lease_owner,lease_expires_at,attempts,max_attempts,execution_generation,payload,monitor)',
    )
    .order('created_at', { ascending: false })
    .limit(50);
  if (courseId) query = query.eq('course_id', courseId);
  const { data, error } = await query;
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
  return NextResponse.json({ builds: data ?? [], acquisitions });
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
        profile: { ...body.profile, mediaAcquisitionOwnerId: auth.id },
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
      publicationPolicy: 'owner-review-required',
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
