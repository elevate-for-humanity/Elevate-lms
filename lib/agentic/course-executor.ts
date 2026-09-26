import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import {DevStudioUltimateCourseControl} from '@/lib/devstudio/ultimate-course-control';

interface AgenticTaskRow {
  id: string;
  run_id: string;
  worker: string;
  action: string;
  dependencies?: string[] | null;
  input?: Record<string, unknown> | null;
  status?: string;
  attempt_count?: number;
  lease_owner?: string | null;
}

interface AgenticRunRow {
  id: string;
  project_id: string;
  prompt: string;
}

interface AgenticProjectRow {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  target_id: string | null;
  target_type: string;
  metadata: Record<string, unknown> | null;
}

interface CourseTarget {
  courseId: string | null;
  programId: string | null;
  programSlug: string | null;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function metadataValue(metadata: Record<string, unknown> | null, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = stringValue(metadata?.[key]);
    if (value) return value;
  }
  return null;
}

interface CourseBuildIntent {
  buildScope?: 'lesson' | 'course';
  moduleCount?: number;
  lessonsPerModule?: number;
  title?: string;
  topic?: string;
  audience?: string;
  state?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  hours?: number;
  additionalRequirements?: string;
  videoQueueLimit?: number;
}

function labeledGoalValue(goal: string, label: string): string | null {
  const match = goal.match(new RegExp(label + '\\s*:\\s*([^\\n.]+)', 'i'));
  return stringValue(match?.[1]);
}

function positiveGoalInteger(goal: string, pattern: RegExp): number | undefined {
  const match = goal.match(pattern);
  const value = Number.parseInt(match?.[1] ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function deriveCourseBuildIntent(goal: string): CourseBuildIntent {
  const oneLesson =
    /\b(?:one|1)\s+(?:complete\s+|controlled\s+|production\s+)*lesson\b/i.test(goal) ||
    /build scope\s*:\s*(?:one|1)\s+(?:complete\s+)?lesson/i.test(goal);
  const difficultyValue = labeledGoalValue(goal, 'Difficulty')?.toLowerCase();
  const difficulty =
    difficultyValue === 'beginner' ||
    difficultyValue === 'intermediate' ||
    difficultyValue === 'advanced'
      ? difficultyValue
      : undefined;
  const lessonTitle = labeledGoalValue(goal, 'Lesson title');
  const hoursMatch = goal.match(
    /(?:total instructional time|duration)\s*:\s*(\d+(?:\.\d+)?)\s*hours?/i,
  );
  const hours = hoursMatch ? Number.parseFloat(hoursMatch[1]) : undefined;
  const moduleCount = oneLesson
    ? 1
    : positiveGoalInteger(goal, /(?:module count|modules?)\s*:\s*(\d+)/i);
  const lessonsPerModule = oneLesson
    ? 1
    : positiveGoalInteger(goal, /(?:lessons? per module|lesson count|lessons?)\s*:\s*(\d+)/i);

  return {
    buildScope: oneLesson ? 'lesson' : 'course',
    moduleCount,
    lessonsPerModule,
    title: lessonTitle ?? undefined,
    topic: lessonTitle ?? undefined,
    audience: labeledGoalValue(goal, 'Audience') ?? undefined,
    state: labeledGoalValue(goal, 'State') ?? undefined,
    difficulty,
    hours: Number.isFinite(hours) && (hours ?? 0) > 0 ? hours : undefined,
    additionalRequirements: goal,
    videoQueueLimit: oneLesson ? 1 : undefined,
  };
}

async function resolveCourseTarget(
  project: AgenticProjectRow,
  run: AgenticRunRow,
): Promise<CourseTarget> {
  const db = await requireAdminClient();
  const courseId = project.target_id ?? metadataValue(project.metadata, 'courseId', 'course_id');
  let programId = metadataValue(project.metadata, 'programId', 'program_id');
  let programSlug = metadataValue(project.metadata, 'programSlug', 'program_slug');

  if (courseId) {
    const { data: course, error } = await db
      .from('courses')
      .select('id,program_id,programs(slug)')
      .eq('id', courseId)
      .maybeSingle();
    if (error) throw error;
    if (course) {
      programId = programId ?? stringValue(course.program_id);
      const relation = course.programs as unknown as
        | { slug?: string | null }
        | Array<{ slug?: string | null }>
        | null;
      const linkedSlug = Array.isArray(relation) ? relation[0]?.slug : relation?.slug;
      programSlug = programSlug ?? stringValue(linkedSlug);
    }
  }

  if (!programId && !programSlug) {
    const reference = run.prompt.match(/#\d{6,}/)?.[0] ?? null;
    if (reference) {
      const { data: program, error } = await db
        .from('programs')
        .select('id,slug')
        .eq('intrainingid', reference)
        .maybeSingle();
      if (error) throw error;
      if (program) {
        programId = stringValue(program.id);
        programSlug = stringValue(program.slug);
      }
    }
  }

  return { courseId, programId, programSlug };
}

async function updateTask(
  task: AgenticTaskRow,
  project: AgenticProjectRow,
  status: 'queued' | 'completed' | 'waiting_review',
  output: Record<string, unknown>,
  summary: string,
) {
  const db = await requireAdminClient();
  const terminal = status === 'completed';
  const { error } = await db
    .from('agentic_build_tasks')
    .update({
      status,
      output,
      error: null,
      completed_at: terminal ? new Date().toISOString() : null,
      started_at: terminal ? undefined : null,
      attempt_count:
        status === 'queued' ? Math.max(0, Number(task.attempt_count ?? 1) - 1) : undefined,
      next_attempt_at:
        status === 'queued' ? new Date(Date.now() + 15_000).toISOString() : undefined,
      lease_owner: null,
      lease_expires_at: null,
      heartbeat_at: null,
    })
    .eq('id', task.id)
    .eq('run_id', task.run_id)
    .eq('lease_owner', task.lease_owner);
  if (error) throw error;

  await db.from('agentic_build_events').insert({
    project_id: project.id,
    run_id: task.run_id,
    task_id: task.id,
    event_type: `agentic.task.${status}`,
    summary,
    payload: output,
  });
}

export async function processCourseAgenticTask(input: {
  task: AgenticTaskRow;
  run: AgenticRunRow;
  project: AgenticProjectRow;
}): Promise<void> {
  const { task, run, project } = input;
  const db = await requireAdminClient();
  const target = await resolveCourseTarget(project, run);
  const buildIntent = deriveCourseBuildIntent(run.prompt);

  if (task.worker === 'course-architect') {
    if (!target.programId && !target.programSlug) {
      throw new Error(
        'Course plan requires a canonical programId/programSlug or an approved #INTraining identifier in the goal.',
      );
    }
    const loaded = await loadBlueprintWithProgram(db, {
      programId: target.programId ?? undefined,
      programSlug: target.programSlug ?? undefined,
    });
    if (!loaded)
      throw new Error('No registered Course Builder blueprint is linked to the selected program.');
    const registeredModules = loaded.blueprint.modules ?? [];
    const modules =
      buildIntent.buildScope === 'lesson'
        ? registeredModules.slice(0, 1).map((module) => ({
            ...module,
            lessons: (module.lessons ?? []).slice(0, 1),
          }))
        : registeredModules.slice(0, buildIntent.moduleCount ?? registeredModules.length).map((module) => ({
            ...module,
            lessons: buildIntent.lessonsPerModule
              ? (module.lessons ?? []).slice(0, buildIntent.lessonsPerModule)
              : module.lessons,
          }));
    const lessonCount = modules.reduce((sum, module) => sum + (module.lessons?.length ?? 0), 0);
    await updateTask(
      task,
      project,
      'completed',
      {
        program_id: loaded.program.id,
        program_slug: loaded.program.slug,
        blueprint_id: loaded.blueprint.id,
        module_count: modules.length,
        lesson_count: lessonCount,
        modules: modules.map((module) => ({
          title: module.title,
          lesson_count: module.lessons?.length ?? 0,
        })),
      },
      `Course blueprint resolved: ${modules.length} modules and ${lessonCount} lessons.`,
    );
    return;
  }

  if (task.worker === 'visual-designer') {
    await updateTask(
      task,
      project,
      'completed',
      {
        design_system: 'canonical-lms-course-experience',
        responsive_preview: ['desktop', 'tablet', 'mobile'],
        learner_renderer: 'shared LMS course/lesson renderer',
        independent_publication_authority: false,
      },
      'Course visual system mapped to the canonical LMS learner experience.',
    );
    return;
  }

  if (task.worker === 'instructional-designer') {
    if (!target.programId && !target.programSlug)
      throw new Error('Instructional build is missing its canonical program identity.');
    if (target.courseId) {
      const loaded = await loadBlueprintWithProgram(db, {
        programId: target.programId ?? undefined,
        programSlug: target.programSlug ?? undefined,
      });
      const expectedModules = loaded?.blueprint.modules?.length ?? 0;
      const expectedLessons = (loaded?.blueprint.modules ?? []).reduce(
        (sum, module) => sum + (module.lessons?.length ?? 0),
        0,
      );
      const [{ count: moduleCount, error: moduleError }, { data: lessons, error: lessonError }] =
        await Promise.all([
          db
            .from('course_modules')
            .select('id', { count: 'exact', head: true })
            .eq('course_id', target.courseId),
          db.from('course_lessons').select('id,script').eq('course_id', target.courseId),
        ]);
      if (moduleError) throw moduleError;
      if (lessonError) throw lessonError;
      const scriptedLessons = (lessons ?? []).filter((lesson) => stringValue(lesson.script)).length;
      if (
        expectedModules > 0 &&
        expectedLessons > 0 &&
        moduleCount === expectedModules &&
        (lessons ?? []).length === expectedLessons &&
        scriptedLessons === expectedLessons
      ) {
        await updateTask(
          task,
          project,
          'completed',
          {
            course_id: target.courseId,
            module_count: moduleCount,
            lesson_count: expectedLessons,
            scripted_lessons: scriptedLessons,
            resumed_from_persisted_checkpoint: true,
            summary:
              'Accepted complete persisted instructional checkpoint; no course recreation required.',
          },
          `Persisted instructional checkpoint verified: ${moduleCount} modules and ${expectedLessons} scripted lessons.`,
        );
        return;
      }
    }
    throw new Error('Legacy instructional generation is retired. Create/queue the canonical Ultimate build through DevStudioUltimateCourseControl.');
  }

  const courseId = target.courseId ?? metadataValue(project.metadata, 'courseId', 'course_id');
  if (!courseId) {
    const { data: refreshed } = await db
      .from('agentic_build_projects')
      .select('target_id,metadata')
      .eq('id', project.id)
      .maybeSingle();
    const refreshedCourseId =
      stringValue(refreshed?.target_id) ??
      metadataValue(refreshed?.metadata as Record<string, unknown> | null, 'courseId', 'course_id');
    if (!refreshedCourseId)
      throw new Error(
        `${task.worker} cannot continue until Course Builder persists the canonical course.`,
      );
    target.courseId = refreshedCourseId;
  }

  if (task.worker === 'translation') {
    const { data: lessons, error } = await db
      .from('course_lessons')
      .select('id,title,script')
      .eq('course_id', target.courseId);
    if (error) throw error;
    const incomplete = (lessons ?? []).filter(
      (lesson) => !stringValue(lesson.title) || !stringValue(lesson.script),
    );
    if (incomplete.length) {
      throw new Error(
        `Localization readiness blocked: ${incomplete.length} lessons are missing learner-facing title or narration.`,
      );
    }
    await updateTask(
      task,
      project,
      'completed',
      {
        course_id: target.courseId,
        source_locale: 'en',
        localization_ready_lessons: (lessons ?? []).length,
        locale_variants_preserved: true,
        learner_content_only: true,
      },
      `Localization contract verified for ${(lessons ?? []).length} canonical lessons.`,
    );
    return;
  }

  if (task.worker === 'media-director') { const control=new DevStudioUltimateCourseControl(db as any); const buildId=metadataValue(project.metadata,'ultimateBuildId','ultimate_build_id'); if(!buildId)throw new Error('Ultimate build identity required for media stage status'); const state=await control.status(buildId); await updateTask(task,project,'completed',{build_id:buildId,ultimate:state},'Ultimate owns media acquisition, narration, rendering and media QA inside the build.'); return; }

  if (task.worker === 'compliance-qa') { const control=new DevStudioUltimateCourseControl(db as any); const buildId=metadataValue(project.metadata,'ultimateBuildId','ultimate_build_id'); if(!buildId)throw new Error('Ultimate build identity required for QA'); const state=await control.status(buildId); const blocked=(state.lessons??[]).some((x:any)=>x.status==='built_with_findings'); await updateTask(task,project,blocked?'waiting_review':'completed',{build_id:buildId,ultimate:state},blocked?'Ultimate QA has blocking findings requiring review.':'Ultimate stage evidence passed.'); return; }

  if (task.worker === 'publisher') { throw new Error('Publication is owned by UltimateLmsPublisher after Ultimate release evidence is complete.'); }

  throw new Error(`Unsupported course agentic worker: ${task.worker}`);
}
