import { requestCanonicalGeneration } from '@/lib/ultimate-course-builder/core/generation-request';
/**
 * /api/admin/course-builder
 *
 * Single application HTTP boundary for course orchestration.
 * Studio controls this surface. Course Builder owns orchestration and delegates
 * execution to private/internal Course Builder capability services.
 */
import { courseLibraryPlayback } from '@/lib/storage/course-library-playback';
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
import { releaseCanonicalCourse } from '@/lib/ultimate-course-builder/release/release-course';
import { reviewCanonicalCourse, reviewCanonicalLessons } from '@/lib/course-builder/review-service';
import {
  normalizeManualAssessmentQuestions,
  persistAssessmentQuestions,
  toQuizQuestion,
} from '@/lib/course-builder/assessment-generator';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getInstructorForCourse } from '@/lib/ai-instructors';
import { logger } from '@/lib/logger';
import { assertCourseBuilderGenerationEnabled } from '@/lib/ultimate-course-builder/core/generation-control';
import {
  CourseBuilderCreditsError,
  getCourseBuilderCreditBalance,
  getCourseBuilderCreditOwner,
} from '@/lib/course-builder/credits';
import {
  courseBuilderCreditErrorResponse as creditErrorResponse,
  refundCourseBuilderRequestCredits as refundReservation,
  reserveCourseBuilderRequestCredits,
  type CreditReservation,
} from '@/lib/course-builder/request-metering';
import {
  loadCredentialConfigs,
  validateCredentialAuthority,
} from '@/lib/course-builder/credential-engine/registry-loader';
import {
  executePaidInference,
  paidArtifactFingerprint,
  reservePaidInference,
} from '@/lib/ai/paid-inference-gateway';
import { loadCourseSession } from '@/lib/studio/course-session';

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
  | 'save-assessment'
  | 'review-course'
  | 'review-lessons'
  | 'audit'
  | 'validate'
  | 'publish'
  | 'publish-persisted'
  | 'repair'
  | 'generate-missing'
  | 'start-existing';

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

async function reserveCredits(input: {
  req: NextRequest;
  body: Record<string, any>;
  userId: string;
  effectiveRoles: string[];
  operation: CreditReservation['operation'];
}): Promise<CreditReservation | null> {
  return reserveCourseBuilderRequestCredits({
    request: input.req,
    userId: input.userId,
    effectiveRoles: input.effectiveRoles,
    operation: input.operation,
    metadata: {
      course_id: input.body.courseId ?? null,
      lesson_id: input.body.lessonId ?? null,
      program_id: input.body.programId ?? null,
      blueprint_id: input.body.blueprintId ?? null,
    },
  });
}

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const action = req.nextUrl.searchParams.get('action') || 'blueprints';
  try {
    if (action === 'session') {
      const courseId = req.nextUrl.searchParams.get('courseId')?.trim() || '';
      if (!courseId) {
        return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
      }
      return NextResponse.json({ session: await loadCourseSession(courseId) });
    }

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
          lessons: blueprint.modules.reduce(
            (sum, courseModule) => sum + (courseModule.lessons?.length ?? 0),
            0,
          ),
          status: blueprint.status,
          socCode: blueprint.socCode ?? null,
        })),
      });
    }

    if (action === 'media-library') {
      const courseId = req.nextUrl.searchParams.get('courseId');
      if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
      const db = await requireAdminClient();
      const course = await loadCourse(courseId);
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

      const { data: videos, error } = await db
        .from('course_videos')
        .select('id,title,lesson_id,storage_path,video_url,status,asset_role,created_at')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows = await Promise.all(
        (videos ?? []).map(video => courseLibraryPlayback(db,video)),
      );

      return NextResponse.json({ ok: true, course, videos: rows });
    }

    if (action === 'instructor-media') {
      const courseId = req.nextUrl.searchParams.get('courseId');
      if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
      const course = await loadCourse(courseId);
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      return NextResponse.json({
        ok: true,
        course,
        instructor: getInstructorForCourse(course.title),
      });
    }

    if (action === 'credits') {
      const db = await requireAdminClient();
      const owner = await getCourseBuilderCreditOwner({
        db,
        userId: auth.id,
        effectiveRoles: auth.effectiveRoles,
      });
      if (owner.operator) return NextResponse.json({ ok: true, operator: true, metered: false });
      if (!owner.tenantId)
        throw new CourseBuilderCreditsError(
          'Course Builder billing owner is missing',
          'TENANT_REQUIRED',
        );
      return NextResponse.json({
        ok: true,
        operator: false,
        metered: true,
        credits: await getCourseBuilderCreditBalance(db, owner.tenantId),
      });
    }

    if (action === 'authoring-options') {
      const db = await requireAdminClient();
      const [{ data: programs, error: programsError }, { data: workforceCredentials }] =
        await Promise.all([
          db.from('programs').select('id,title,slug,status,is_active').order('title'),
          db
            .from('credential_registry')
            .select('id,name,abbreviation,issuing_authority,is_active')
            .order('name'),
        ]);
      if (programsError) throw programsError;
      const standards = loadCredentialConfigs().map((credential) => {
        const gaps = validateCredentialAuthority(credential);
        return {
          id: credential.id,
          slug: credential.slug,
          name: credential.name,
          provider: credential.provider,
          category: credential.category,
          type: credential.type,
          states: credential.states ?? [],
          registryKey: credential.authority?.registryKey ?? null,
          sourceUrl: credential.authority?.sourceUrl ?? null,
          version: credential.authority?.version ?? null,
          effectiveDate: credential.authority?.effectiveDate ?? null,
          standardStatus: credential.authority?.status ?? 'draft',
          checkedAt: credential.authority?.checkedAt ?? null,
          objectiveCount: credential.objectives?.length ?? 0,
          claimReady: gaps.length === 0,
          gaps,
        };
      });
      return NextResponse.json({
        programs: programs ?? [],
        standards,
        workforceCredentials: (workforceCredentials ?? []).map((credential) => ({
          id: credential.id,
          name: credential.name,
          credential_code: credential.abbreviation,
          issuing_authority: credential.issuing_authority,
          status: credential.is_active ? 'active' : 'inactive',
        })),
        policy: {
          drafting: 'allowed',
          externalClaims: 'verified-evidence-required',
          unsupportedStandardAction: 'create-standards-development-record',
        },
      });
    }

    return NextResponse.json(
      { error: `Unsupported Course Builder GET action: ${action}` },
      { status: 400 },
    );
  } catch (error) {
    const credits = creditErrorResponse(error);
    if (credits) return credits;
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
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const action = String(body.action || 'generate') as CourseBuilderAction;
  const archivedGenerationActions: CourseBuilderAction[] = [
    'generate',
    'generate-from-blueprint',
    'queue-media',
    'repair',
    'generate-missing',
    'start-existing',
  ];
  if (archivedGenerationActions.includes(action)) {
    try {
      const db = await requireAdminClient();
      await assertCourseBuilderGenerationEnabled(db, body.courseId);
      const result = await requestCanonicalGeneration(db, body, auth.id);
      return NextResponse.json(result, { status: result.ok ? (result.dryRun ? 200 : 202) : 503 });
    } catch (error) {
      logger.error('[course-builder] Canonical generation failed', error);
      return NextResponse.json({ ok: false, error: 'Course Builder could not start. Check its connection and source configuration.' }, { status: 503 });
    }
  }

  if (action === 'save-program-config') {
    try {
      return NextResponse.json({
        ok: true,
        course: await saveCourseProgramConfiguration(body.program ?? body),
      });
    } catch (error) {
      logger.error('[course-builder] Program configuration failed', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to save course configuration' },
        { status: 400 },
      );
    }
  }
  if (action === 'save-module') {
    try {
      return NextResponse.json({ ok: true, module: await saveCourseModule(body.module ?? body) });
    } catch (error) {
      logger.error('[course-builder] Module save failed', error);
      return NextResponse.json({ ok: false, error: 'Failed to save module' }, { status: 400 });
    }
  }
  if (action === 'save-lesson') {
    try {
      return NextResponse.json({ ok: true, lesson: await saveCourseLesson(body.lesson ?? body) });
    } catch (error) {
      logger.error('[course-builder] Lesson save failed', error);
      return NextResponse.json({ ok: false, error: 'Failed to save lesson' }, { status: 400 });
    }
  }
  if (action === 'patch-lesson') {
    try {
      return NextResponse.json({ ok: true, lesson: await patchCourseLesson(body.lesson ?? body) });
    } catch (error) {
      logger.error('[course-builder] Lesson patch failed', error);
      return NextResponse.json({ ok: false, error: 'Failed to update lesson' }, { status: 400 });
    }
  }
  if (action === 'delete-lesson') {
    try {
      return NextResponse.json({ ok: true, result: await deleteCourseLesson(body.lesson ?? body) });
    } catch (error) {
      logger.error('[course-builder] Lesson delete failed', error);
      return NextResponse.json({ ok: false, error: 'Failed to delete lesson' }, { status: 400 });
    }
  }
  if (action === 'reorder-lessons') {
    try {
      return NextResponse.json({ ok: true, result: await reorderCourseLessons(body) });
    } catch (error) {
      logger.error('[course-builder] Lesson reorder failed', error);
      return NextResponse.json({ ok: false, error: 'Failed to reorder lessons' }, { status: 400 });
    }
  }
  if (action === 'link-scorm') {
    try {
      return NextResponse.json({ ok: true, package: await linkCourseScormPackage(body, auth.id) });
    } catch (error) {
      logger.error('[course-builder] SCORM link failed', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to link SCORM package' },
        { status: 400 },
      );
    }
  }
  if (action === 'save-assessment') {
    const lessonId = typeof body.lessonId === 'string' ? body.lessonId.trim() : '';
    const passingScore = Number(body.passingScore);
    if (!lessonId) {
      return NextResponse.json({ ok: false, error: 'lessonId is required' }, { status: 400 });
    }
    if (!Number.isInteger(passingScore) || passingScore < 1 || passingScore > 100) {
      return NextResponse.json(
        { ok: false, error: 'passingScore must be an integer between 1 and 100' },
        { status: 400 },
      );
    }
    try {
      const db = await requireAdminClient();
      const { data: lesson, error: lessonError } = await db
        .from('course_lessons')
        .select('id,module_id,domain_key,competency_checks')
        .eq('id', lessonId)
        .maybeSingle();
      if (lessonError) throw lessonError;
      if (!lesson) {
        return NextResponse.json({ ok: false, error: 'Assessment lesson not found' }, { status: 404 });
      }

      let moduleDomainKey: string | undefined;
      if (lesson.module_id) {
        const { data: courseModule, error: moduleError } = await db
          .from('course_modules')
          .select('domain_key')
          .eq('id', lesson.module_id)
          .maybeSingle();
        if (moduleError) throw moduleError;
        moduleDomainKey = courseModule?.domain_key ?? undefined;
      }
      const competencyKeys = Array.isArray(lesson.competency_checks)
        ? lesson.competency_checks
            .map((item: unknown) => {
              if (typeof item === 'string') return item;
              if (item && typeof item === 'object' && 'key' in item) return String(item.key);
              return '';
            })
            .filter(Boolean)
        : [];
      const questions = normalizeManualAssessmentQuestions(lessonId, body.questions, {
        domainKey: lesson.domain_key ?? moduleDomainKey,
        competencyKeys,
      });
      const result = await persistAssessmentQuestions(db, lessonId, questions, {
        replaceExisting: true,
        passingScore,
      });
      if (result.errors.length) {
        return NextResponse.json(
          { ok: false, error: result.errors.join('; '), errors: result.errors },
          { status: 422 },
        );
      }
      return NextResponse.json({
        ok: true,
        lessonId,
        writtenToDb: result.writtenToDb,
        questions: result.questions.map(toQuizQuestion).filter(Boolean),
        passingScore,
      });
    } catch (error) {
      logger.error('[course-builder] Assessment save failed', error);
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Failed to save assessment' },
        { status: 422 },
      );
    }
  }
  if (action === 'review-course') {
    try {
      return NextResponse.json({
        ok: true,
        review: await reviewCanonicalCourse(body.review ?? body, auth.id),
      });
    } catch (error) {
      logger.error('[course-builder] Course review failed', error);
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Course review failed' },
        { status: 422 },
      );
    }
  }
  if (action === 'review-lessons') {
    try {
      return NextResponse.json({
        ok: true,
        review: await reviewCanonicalLessons(body.review ?? body, auth.id),
      });
    } catch (error) {
      logger.error('[course-builder] Lesson review failed', error);
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Lesson review failed' },
        { status: 422 },
      );
    }
  }

  if (action === 'audit' || action === 'validate') {
    try {
      const result = auditCourseGovernance((body.template ?? body) as any);
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    } catch (error) {
      logger.error('[course-builder] Governance audit failed', error);
      return NextResponse.json(
        { ok: false, error: 'Course governance audit failed' },
        { status: 400 },
      );
    }
  }

  if (action === 'publish') {
    try {
      const result = await publishGovernedCourse((body.template ?? body) as any);
      return NextResponse.json(result, { status: result.ok ? 202 : 422 });
    } catch (error) {
      logger.error('[course-builder] Governed publication failed', error);
      return NextResponse.json({ ok: false, error: 'Course publication failed' }, { status: 500 });
    }
  }

  if (action === 'publish-persisted') {
    const courseId = typeof body.courseId === 'string' ? body.courseId.trim() : '';
    if (!courseId) {
      return NextResponse.json({ ok: false, error: 'courseId is required' }, { status: 400 });
    }
    try {
      const result = await releaseCanonicalCourse(await requireAdminClient(), courseId, auth.id);
      return NextResponse.json(result, { status: result.ok ? 200 : 422 });
    } catch (error) {
      logger.error('[course-builder] Persisted publication failed', error);
      return NextResponse.json(
        { ok: false, error: 'The current Course Builder must finish its verified release checks before publication.' },
        { status: 409 },
      );
    }
  }

  return NextResponse.json({ error: `Unsupported Course Builder action: ${action}` }, { status: 400 });
}
