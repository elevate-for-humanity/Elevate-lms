import { logger } from '@/lib/logger';
import { ULTIMATE_LESSON_CONTRACT_VERSION } from '@/lib/ultimate-course-builder/core/lesson-contract';
import { validateLessonBlueprint } from '@/lib/ultimate-course-builder/instructional/lesson-blueprint';
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { UltimateJobQueue } from '@/lib/ultimate-course-builder/worker/job-queue';
import { UltimateAppendixAStandardsSource } from '@/lib/ultimate-course-builder/credential/appendix-a-source';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function databaseFailure(error: unknown, status = 500) {
  logger.error('Ultimate Course Builder database operation failed', error);
  return NextResponse.json({ error: 'Course Builder operation failed. Check the server audit log.' }, { status });
}

type CompetencyRow = {
  competency_key?: string | null;
  category?: string | null;
  source_label?: string | null;
  description?: string | null;
};

function competencyType(row: CompetencyRow, regulated: boolean) {
  if (!regulated) return 'knowledge' as const;
  const value = `${row.category ?? ''} ${row.source_label ?? ''}`;
  if (/trim|clean|covering|cut|shav|sanit|disinfect|chemical|color/i.test(value)) {
    return 'practical_skill' as const;
  }
  if (/discuss|recommend|consult|select|decide/i.test(value)) return 'decision' as const;
  return 'knowledge' as const;
}

async function buildUltimateProfile(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  input: {
    courseId: string;
    programSlug: string;
    title: string;
    topic?: string;
    audience?: string;
    state?: string;
  },
) {
  const registeredSource = new UltimateAppendixAStandardsSource();
  if (registeredSource.supports({ programSlug: input.programSlug })) {
    const profile = await registeredSource.load({ programSlug: input.programSlug });
    return {
      ...profile,
      title: input.title,
      audience: input.audience?.trim() || undefined,
    };
  }

  const { data: standard, error: standardError } = await db
    .from('apprenticeship_standard_versions')
    .select('*')
    .eq('program_slug', input.programSlug)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (standardError) throw standardError;

  let competencyRows: CompetencyRow[] = [];
  if (standard) {
    const competencyResult = await db
      .from('apprenticeship_standard_competencies')
      .select('competency_key,category,source_label,description')
      .eq('standard_key', standard.standard_key)
      .eq('is_required', true)
      .order('display_order');
    if (competencyResult.error) throw competencyResult.error;
    competencyRows = competencyResult.data ?? [];
  }

  if (!competencyRows.length) {
    const { data: lessons, error: lessonError } = await db
      .from('course_lessons')
      .select('id,title,learning_objectives')
      .eq('course_id', input.courseId)
      .order('order_index');
    if (lessonError) throw lessonError;
    competencyRows = (lessons ?? []).map((lesson, index) => ({
      competency_key: lesson.id,
      category: lesson.title || `Lesson ${index + 1}`,
      source_label: lesson.title || `Lesson ${index + 1}`,
      description:
        Array.isArray(lesson.learning_objectives) && lesson.learning_objectives.length
          ? lesson.learning_objectives.join('; ')
          : `Teach and verify ${lesson.title || `lesson ${index + 1}`}.`,
    }));
  }

  if (!competencyRows.length) {
    competencyRows = [
      {
        competency_key: `course-${input.courseId}`,
        category: input.title,
        source_label: input.title,
        description:
          input.topic?.trim() ||
          `Build complete learner-ready instruction, practice, assessment, media, accessibility, QA, and release evidence for ${input.title}.`,
      },
    ];
  }

  return {
    id: standard?.standard_key ?? `course:${input.courseId}`,
    title: input.title,
    authority: standard?.source_authority ?? 'course-defined',
    jurisdiction: input.state?.trim() || standard?.state || 'IN',
    standardVersion: String(
      standard?.revision_date || standard?.registration_date || 'course-defined',
    ),
    effectiveDate: standard?.revision_date || standard?.registration_date || undefined,
    sourceDocuments: standard
      ? ['DOL Appendix A Work Process Schedule', 'Related Instruction Outline']
      : [],
    socCodes: standard?.onet_soc_code ? [standard.onet_soc_code] : [],
    trainingRequirements: {
      instructionalHours: standard?.related_instruction_hours || undefined,
    },
    audience: input.audience?.trim() || undefined,
    competencies: competencyRows.map((row, index) => ({
      id: row.competency_key || `competency-${index + 1}`,
      title: row.category || row.source_label || `Competency ${index + 1}`,
      description: row.description || row.source_label || `Demonstrate competency ${index + 1}`,
      type: competencyType(row, Boolean(standard)),
      authorityRequirementIds: standard && row.competency_key ? [row.competency_key] : [],
      requiresDemonstration: Boolean(standard),
      requiresPracticalEvidence: Boolean(standard),
      criticalSafetyCompetency: standard
        ? /clean|sanit|disinfect|protective|safety/i.test(
            `${row.category ?? ''} ${row.description ?? ''}`,
          )
        : false,
    })),
  };
}

export async function GET(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const db = await requireAdminClient();
  const buildId = req.nextUrl.searchParams.get('buildId')?.trim();
  const courseId = req.nextUrl.searchParams.get('courseId')?.trim();

  if (buildId) {
    const { data, error } = await db
      .from('ultimate_course_builds')
      .select('*,ultimate_lesson_builds(*,ultimate_lesson_steps(*))')
      .eq('id', buildId)
      .single();
    return error
      ? databaseFailure(error)
      : NextResponse.json({ build: data });
  }

  let query = db
    .from('ultimate_course_builds')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (courseId) query = query.eq('course_id', courseId);
  const { data, error } = await query;
  return error
    ? databaseFailure(error)
    : NextResponse.json({ builds: data ?? [] });
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
      profile.instructionalSources = body.instructionalSources;
    }
    profile.lessonContractVersion = ULTIMATE_LESSON_CONTRACT_VERSION;
    const saved = await db
      .from('ultimate_course_builds')
      .update({ profile, updated_at: new Date().toISOString() })
      .eq('id', build.id)
      .eq('status', build.status)
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
        profile: body.profile,
        status: 'initializing',
        current_step: 'standards_lock',
        findings: [],
      })
      .select('*')
      .single();
    return error
      ? databaseFailure(error)
      : NextResponse.json({ ok: true, build: data });
  }

  if (body.action === 'status') {
    const { data, error } = await db
      .from('ultimate_course_builds')
      .select('*')
      .eq('id', body.buildId)
      .single();
    return error
      ? databaseFailure(error)
      : NextResponse.json({ ok: true, build: data });
  }

  if (body.action === 'queue-course') {
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
    const profile = await buildUltimateProfile(db, {
      courseId: course.id,
      programSlug,
      title: String(body.title || course.title),
      topic: String(body.topic || course.description || ''),
      audience: String(body.audience || ''),
      state: String(body.state || ''),
    });

    const { data: activeBuild, error: activeError } = await db
      .from('ultimate_course_builds')
      .select('id,course_id,status,current_step,profile,created_at,updated_at')
      .eq('course_id', course.id)
      .in('status', ['initializing', 'queued', 'running'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (activeError) throw activeError;

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
    return NextResponse.json(
      {
        ok: true,
        queued: true,
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
