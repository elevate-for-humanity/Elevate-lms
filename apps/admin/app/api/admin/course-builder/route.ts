/**
 * /api/admin/course-builder
 *
 * Single application HTTP boundary for course orchestration.
 * Studio controls this surface. Course Builder owns orchestration and delegates
 * execution to private/internal Course Builder capability services.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { loadAllBlueprints } from '@/lib/course-factory';
import type { FactoryStage } from '@/lib/course-factory';
import {
  courseFactory,
  saveCourseProgramConfiguration,
  auditCourseGovernance,
  publishGovernedCourse,
  repairCanonicalCourse,
  queueCourseMedia,
  normalizeGeneratedCourseForGovernance,
} from '@/lib/course-builder/orchestrator';
import {
  saveCourseModule,
  saveCourseLesson,
  patchCourseLesson,
  deleteCourseLesson,
  reorderCourseLessons,
  linkCourseScormPackage,
} from '@/lib/course-builder/edit-service';
import { publishPersistedCourse } from '@/lib/course-builder/persisted-publish-service';
import { reviewCanonicalCourse, reviewCanonicalLessons } from '@/lib/course-builder/review-service';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getInstructorForCourse } from '@/lib/ai-instructors';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type PipelineStage =
  | 'blueprint'
  | 'lessons'
  | 'quizzes'
  | 'validate'
  | 'publish'
  | 'videos'
  | 'complete'
  | 'error';

type CourseBuilderAction =
  | 'generate'
  | 'generate-from-blueprint'
  | 'queue-media'
  | 'save-program-config'
  | 'save-module'
  | 'save-lesson'
  | 'patch-lesson'
  | 'delete-lesson'
  | 'reorder-lessons'
  | 'link-scorm'
  | 'review-course'
  | 'review-lessons'
  | 'audit'
  | 'validate'
  | 'publish'
  | 'publish-persisted'
  | 'repair'
  | 'generate-missing';

function toPipelineStage(stage: FactoryStage): PipelineStage {
  if (stage === 'enrich') return 'lessons';
  if (stage === 'assess') return 'quizzes';
  if (stage === 'media') return 'videos';
  if (stage === 'validate') return 'validate';
  if (stage === 'publish') return 'publish';
  if (stage === 'complete') return 'complete';
  if (stage === 'error') return 'error';
  return 'blueprint';
}

async function loadCourse(courseId: string) {
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('courses')
    .select('id,title,slug')
    .eq('id', courseId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const action = req.nextUrl.searchParams.get('action') || 'blueprints';
  try {
    if (action === 'blueprints') {
      const id = req.nextUrl.searchParams.get('id');
      const registry = await loadAllBlueprints();
      if (id) {
        const blueprint = registry.find((item) => item.id === id);
        if (!blueprint) return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
        return NextResponse.json({ blueprint });
      }
      return NextResponse.json({
        blueprints: registry.map((blueprint) => ({
          id: blueprint.id,
          title: blueprint.credentialTitle,
          credentialCode: blueprint.credentialCode,
          state: blueprint.state,
          slug: blueprint.programSlug,
          modules: blueprint.modules.length,
          lessons: blueprint.modules.reduce((sum, courseModule) => sum + (courseModule.lessons?.length ?? 0), 0),
          status: blueprint.status,
          socCode: blueprint.socCode ?? null,
        })),
      });
    }

    if (action === 'instructor-media') {
      const courseId = req.nextUrl.searchParams.get('courseId');
      if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
      const course = await loadCourse(courseId);
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      return NextResponse.json({ ok: true, course, instructor: getInstructorForCourse(course.title) });
    }

    return NextResponse.json({ error: `Unsupported Course Builder GET action: ${action}` }, { status: 400 });
  } catch (error) {
    logger.error('[course-builder] GET action failed', error);
    return NextResponse.json({ error: 'Course Builder action failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  let body: Record<string, any>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const action = String(body.action || 'generate') as CourseBuilderAction;

  if (action === 'generate-from-blueprint') {
    if (!body.blueprintId || !body.programId) return NextResponse.json({ error: 'blueprintId and programId are required' }, { status: 400 });
    try {
      const blueprints = await loadAllBlueprints();
      const blueprint = blueprints.find((item) => item.id === body.blueprintId);
      if (!blueprint) return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
      const progress: Array<{ stage: string; message: string; progress?: number }> = [];
      const result = await courseFactory({
        programId: body.programId,
        blueprint,
        mode: ['replace','missing-only','refresh'].includes(body.mode) ? body.mode : 'refresh',
        contentSource: ['ai','blueprint','curriculum_lessons'].includes(body.contentSource) ? body.contentSource : 'ai',
        videoMode: body.videoMode === 'off' ? 'off' : 'queue',
        videoQueueLimit: typeof body.videoQueueLimit === 'number' && body.videoQueueLimit > 0 ? body.videoQueueLimit : null,
      }, (stage, message, percent) => progress.push({ stage, message, progress: percent }));
      return NextResponse.json({ ...result, progress }, { status: result.ok ? 200 : 422 });
    } catch (error) {
      logger.error('[course-builder] Blueprint generation failed', error);
      return NextResponse.json({ error: 'Course generation failed' }, { status: 500 });
    }
  }

  if (action === 'queue-media') {
    if (!body.courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    try {
      const course = await loadCourse(body.courseId);
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      const result = await queueCourseMedia({
        courseId: body.courseId,
        onlyMissing: body.onlyMissing !== false,
        force: body.force === true,
        limit: typeof body.limit === 'number' ? body.limit : null,
      });
      return NextResponse.json({ ok: result.failed === 0, course, instructor: getInstructorForCourse(course.title), result });
    } catch (error) {
      logger.error('[course-builder] Media queue failed', error);
      return NextResponse.json({ error: 'Unable to queue course media' }, { status: 500 });
    }
  }

  if (action === 'save-program-config') {
    try { return NextResponse.json({ ok: true, course: await saveCourseProgramConfiguration(body.program ?? body) }); }
    catch (error) { logger.error('[course-builder] Program configuration failed', error); return NextResponse.json({ ok: false, error: 'Failed to save course configuration' }, { status: 400 }); }
  }
  if (action === 'save-module') {
    try { return NextResponse.json({ ok: true, module: await saveCourseModule(body.module ?? body) }); }
    catch (error) { logger.error('[course-builder] Module save failed', error); return NextResponse.json({ ok: false, error: 'Failed to save module' }, { status: 400 }); }
  }
  if (action === 'save-lesson') {
    try { return NextResponse.json({ ok: true, lesson: await saveCourseLesson(body.lesson ?? body) }); }
    catch (error) { logger.error('[course-builder] Lesson save failed', error); return NextResponse.json({ ok: false, error: 'Failed to save lesson' }, { status: 400 }); }
  }
  if (action === 'patch-lesson') {
    try { return NextResponse.json({ ok: true, lesson: await patchCourseLesson(body.lesson ?? body) }); }
    catch (error) { logger.error('[course-builder] Lesson patch failed', error); return NextResponse.json({ ok: false, error: 'Failed to update lesson' }, { status: 400 }); }
  }
  if (action === 'delete-lesson') {
    try { return NextResponse.json({ ok: true, result: await deleteCourseLesson(body.lesson ?? body) }); }
    catch (error) { logger.error('[course-builder] Lesson delete failed', error); return NextResponse.json({ ok: false, error: 'Failed to delete lesson' }, { status: 400 }); }
  }
  if (action === 'reorder-lessons') {
    try { return NextResponse.json({ ok: true, result: await reorderCourseLessons(body) }); }
    catch (error) { logger.error('[course-builder] Lesson reorder failed', error); return NextResponse.json({ ok: false, error: 'Failed to reorder lessons' }, { status: 400 }); }
  }
  if (action === 'link-scorm') {
    try { return NextResponse.json({ ok: true, package: await linkCourseScormPackage(body, auth.id) }); }
    catch (error) { logger.error('[course-builder] SCORM link failed', error); return NextResponse.json({ ok: false, error: 'Failed to link SCORM package' }, { status: 400 }); }
  }
  if (action === 'review-course') {
    try { return NextResponse.json({ ok: true, review: await reviewCanonicalCourse(body.review ?? body, auth.id) }); }
    catch (error) { logger.error('[course-builder] Course review failed', error); return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Course review failed' }, { status: 422 }); }
  }
  if (action === 'review-lessons') {
    try { return NextResponse.json({ ok: true, review: await reviewCanonicalLessons(body.review ?? body, auth.id) }); }
    catch (error) { logger.error('[course-builder] Lesson review failed', error); return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Lesson review failed' }, { status: 422 }); }
  }

  if (action === 'audit' || action === 'validate') {
    try {
      const result = auditCourseGovernance((body.template ?? body) as any);
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    } catch (error) {
      logger.error('[course-builder] Governance audit failed', error);
      return NextResponse.json({ ok: false, error: 'Course governance audit failed' }, { status: 400 });
    }
  }

  if (action === 'publish') {
    try {
      const result = await publishGovernedCourse((body.template ?? body) as any);
      return NextResponse.json(result, { status: result.ok ? 200 : 422 });
    } catch (error) {
      logger.error('[course-builder] Governed publication failed', error);
      return NextResponse.json({ ok: false, error: 'Course publication failed' }, { status: 500 });
    }
  }

  if (action === 'publish-persisted') {
    const courseId = typeof body.courseId === 'string' ? body.courseId.trim() : '';
    if (!courseId) return NextResponse.json({ ok: false, error: 'courseId is required' }, { status: 400 });
    try {
      const result = await publishPersistedCourse({ courseId, actorId: auth.id, label: typeof body.label === 'string' ? body.label : undefined, request: req });
      return NextResponse.json(result, { status: result.ok ? 200 : 422 });
    } catch (error) {
      logger.error('[course-builder] Persisted publication failed', error);
      return NextResponse.json({ ok: false, error: 'Failed to publish persisted course' }, { status: 500 });
    }
  }

  if (action === 'repair' || action === 'generate-missing') {
    const courseId = typeof body.courseId === 'string' ? body.courseId.trim() : '';
    if (!courseId) return NextResponse.json({ ok: false, error: 'courseId is required' }, { status: 400 });
    try {
      const result = await repairCanonicalCourse(courseId);
      return NextResponse.json({ ok: result.ok, result }, { status: result.ok ? 200 : 422 });
    } catch (error) {
      logger.error('[course-builder] Course repair failed', error);
      return NextResponse.json({ ok: false, error: 'Course repair failed' }, { status: 500 });
    }
  }

  if (action !== 'generate') return NextResponse.json({ error: `Unsupported Course Builder action: ${action}` }, { status: 400 });

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
  const programId = typeof body.programId === 'string' ? body.programId.trim() : '';
  if (!title || !topic || !programId) return NextResponse.json({ error: 'title, topic, and programId are required' }, { status: 400 });
  if (body.moduleCount != null && (body.moduleCount < 1 || body.moduleCount > 40)) return NextResponse.json({ error: 'moduleCount must be between 1 and 40' }, { status: 400 });
  if (body.lessonsPerModule != null && (body.lessonsPerModule < 1 || body.lessonsPerModule > 20)) return NextResponse.json({ error: 'lessonsPerModule must be between 1 and 20' }, { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const write = (data: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      try {
        const result = await courseFactory({
          title,
          topic,
          difficulty: body.difficulty ?? 'intermediate',
          programId,
          programSlug: body.programSlug,
          moduleCount: body.moduleCount,
          lessonsPerModule: body.lessonsPerModule,
          credential: body.credential,
          state: body.state,
          audience: body.audience,
          hours: body.hours,
          deliveryFormat: body.deliveryFormat,
          additionalRequirements: body.additionalRequirements,
          contentSource: 'ai',
          mode: 'refresh',
          videoMode: body.includeVideos === false ? 'off' : 'queue',
          dryRun: Boolean(body.dryRun),
        }, (stage, message, progress) => write({ stage: toPipelineStage(stage), message, progress }));

        let governance: Awaited<ReturnType<typeof normalizeGeneratedCourseForGovernance>> | null = null;
        if (result.ok && result.courseId && !result.dryRun) {
          write({ stage: 'validate', message: 'Normalizing competency traceability and self-paced learning assets.', progress: 96 });
          governance = await normalizeGeneratedCourseForGovernance(result.courseId);
        }
        write({
          stage: 'complete',
          result: {
            success: result.ok,
            courseId: result.courseId ?? null,
            title: result.title ?? title,
            modulesGenerated: result.moduleCount ?? 0,
            lessonsGenerated: result.lessonCount ?? 0,
            lessonsWithQuizzes: result.assessmentsGenerated ?? 0,
            videosQueued: result.videosQueued ?? 0,
            governance,
            errors: result.errors ?? [],
            dryRun: Boolean(result.dryRun),
          },
        });
      } catch (error) {
        logger.error('[course-builder] Course Factory error', error);
        write({ stage: 'error', message: 'Course generation failed. Review server logs for details.' });
      } finally { controller.close(); }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
