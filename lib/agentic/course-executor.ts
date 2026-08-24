import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { loadBlueprintWithProgram } from '@/lib/course-factory/blueprint-loader';
import { getCourseMediaState } from '@/lib/course-factory/media-manager';
import { courseBuilderController } from '@/lib/devstudio/course-builder-controller';
import { queueCourseMedia } from '@/lib/course-builder/orchestrator';
import {
  publishPersistedCourseWithClient,
  runPersistedCourseProcurementHealthCheckWithClient,
} from '@/lib/course-builder/persisted-publish-service';

interface AgenticTaskRow {
  id: string;
  run_id: string;
  worker: string;
  action: string;
  dependencies?: string[] | null;
  input?: Record<string, unknown> | null;
  status?: string;
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

async function resolveCourseTarget(project: AgenticProjectRow, run: AgenticRunRow): Promise<CourseTarget> {
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
      const relation = course.programs as unknown as { slug?: string | null } | Array<{ slug?: string | null }> | null;
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
    })
    .eq('id', task.id)
    .eq('run_id', task.run_id);
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

function reviewOnlyBlockingIssues(issues: string[]) {
  const reviewPatterns = [
    'review_status must be approved',
    'authorized human course reviewer missing',
    'authorized human course review timestamp missing',
    'AI lesson not human-approved',
    'authorized human sign-off missing',
  ];
  return issues.length > 0 && issues.every((issue) => reviewPatterns.some((pattern) => issue.includes(pattern)));
}

export async function processCourseAgenticTask(input: {
  task: AgenticTaskRow;
  run: AgenticRunRow;
  project: AgenticProjectRow;
}): Promise<void> {
  const { task, run, project } = input;
  const db = await requireAdminClient();
  const target = await resolveCourseTarget(project, run);

  if (task.worker === 'course-architect') {
    if (!target.programId && !target.programSlug) {
      throw new Error('Course plan requires a canonical programId/programSlug or an approved #INTraining identifier in the goal.');
    }
    const loaded = await loadBlueprintWithProgram(db, {
      programId: target.programId ?? undefined,
      programSlug: target.programSlug ?? undefined,
    });
    if (!loaded) throw new Error('No registered Course Builder blueprint is linked to the selected program.');
    const modules = loaded.blueprint.modules ?? [];
    const lessonCount = modules.reduce((sum, module) => sum + (module.lessons?.length ?? 0), 0);
    await updateTask(task, project, 'completed', {
      program_id: loaded.program.id,
      program_slug: loaded.program.slug,
      blueprint_id: loaded.blueprint.id,
      module_count: modules.length,
      lesson_count: lessonCount,
      modules: modules.map((module) => ({
        title: module.title,
        lesson_count: module.lessons?.length ?? 0,
      })),
    }, `Course blueprint resolved: ${modules.length} modules and ${lessonCount} lessons.`);
    return;
  }

  if (task.worker === 'visual-designer') {
    await updateTask(task, project, 'completed', {
      design_system: 'canonical-lms-course-experience',
      responsive_preview: ['desktop', 'tablet', 'mobile'],
      learner_renderer: 'shared LMS course/lesson renderer',
      independent_publication_authority: false,
    }, 'Course visual system mapped to the canonical LMS learner experience.');
    return;
  }

  if (task.worker === 'instructional-designer') {
    if (!target.programId && !target.programSlug) throw new Error('Instructional build is missing its canonical program identity.');
    const result = await courseBuilderController({
      programId: target.programId ?? undefined,
      programSlug: target.programSlug ?? undefined,
      mode: target.courseId ? 'missing-only' : 'replace',
      contentSource: 'ai',
      videoMode: 'off',
    });
    if (!result.ok || !result.courseId) {
      throw new Error(`Course Builder failed: ${(result.errors ?? result.warnings ?? []).join('; ') || result.status || 'unknown error'}`);
    }
    await db
      .from('agentic_build_projects')
      .update({
        target_id: result.courseId,
        metadata: {
          ...(project.metadata ?? {}),
          programId: target.programId,
          programSlug: target.programSlug,
          courseId: result.courseId,
          moduleCount: result.moduleCount,
          lessonCount: result.lessonCount,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', project.id);
    await updateTask(task, project, 'completed', {
      course_id: result.courseId,
      course_slug: result.courseSlug,
      module_count: result.moduleCount,
      lesson_count: result.lessonCount,
      assessments_generated: result.assessmentsGenerated,
      completion_ratio: result.completionRatio,
      warnings: result.warnings ?? [],
    }, `Canonical Course Builder persisted ${result.moduleCount ?? 0} modules and ${result.lessonCount ?? 0} lessons.`);
    return;
  }

  const courseId = target.courseId ?? metadataValue(project.metadata, 'courseId', 'course_id');
  if (!courseId) {
    const { data: refreshed } = await db
      .from('agentic_build_projects')
      .select('target_id,metadata')
      .eq('id', project.id)
      .maybeSingle();
    const refreshedCourseId = stringValue(refreshed?.target_id) ?? metadataValue(
      refreshed?.metadata as Record<string, unknown> | null,
      'courseId',
      'course_id',
    );
    if (!refreshedCourseId) throw new Error(`${task.worker} cannot continue until Course Builder persists the canonical course.`);
    target.courseId = refreshedCourseId;
  }

  if (task.worker === 'media-director') {
    const queued = await queueCourseMedia({ courseId: target.courseId, onlyMissing: true });
    const media = await getCourseMediaState(target.courseId, { verifyUrls: true });
    if (!media.completePackage) {
      await updateTask(task, project, 'queued', {
        course_id: target.courseId,
        ...queued,
        ...media,
        note: 'Queued is not complete. This task remains queued until every required canonical media asset is complete and playable.',
      }, `Media pending: ${media.complete}/${media.expectedTotal} canonical assets complete; ${media.failed} failed; ${media.queued} queued; ${media.rendering} rendering.`);
      return;
    }
    await updateTask(task, project, 'completed', { course_id: target.courseId, ...queued, ...media }, 'All required canonical course media is persisted and playable.');
    return;
  }

  if (task.worker === 'compliance-qa') {
    const media = await getCourseMediaState(target.courseId, { verifyUrls: true });
    if (!media.completePackage) {
      await updateTask(task, project, 'queued', { course_id: target.courseId, ...media }, 'QA is waiting for canonical Course Factory media readiness.');
      return;
    }
    const health = await runPersistedCourseProcurementHealthCheckWithClient(db, target.courseId);
    if (health.pass) {
      await updateTask(task, project, 'completed', {
        course_id: target.courseId,
        procurement: health.metrics,
        media,
        blocking_issues: [],
      }, 'Course passed canonical procurement, governance, accessibility, instructional, and media readiness checks.');
      return;
    }
    if (reviewOnlyBlockingIssues(health.blocking_issues)) {
      await updateTask(task, project, 'waiting_review', {
        course_id: target.courseId,
        procurement: health.metrics,
        media,
        blocking_issues: health.blocking_issues,
        human_review_required: true,
      }, 'Technical course validation is complete; authorized human review is still required before publication.');
      return;
    }
    throw new Error(`Course governance failed: ${health.blocking_issues.join(' | ')}`);
  }

  if (task.worker === 'publisher') {
    if (!project.user_id) throw new Error('Canonical publication requires an authenticated reviewer/publisher identity.');
    const media = await getCourseMediaState(target.courseId, { verifyUrls: true });
    if (!media.completePackage) {
      throw new Error(`Publication blocked: canonical media package incomplete (${media.complete}/${media.expectedTotal} complete, ${media.failed} failed, ${media.queued} queued, ${media.rendering} rendering).`);
    }
    const result = await publishPersistedCourseWithClient({
      db,
      courseId: target.courseId,
      actorId: project.user_id,
      label: 'Agentic Course Builder publication',
    });
    if (!result.ok) {
      throw new Error(`Publication blocked: ${(result.blocking_issues ?? []).join(' | ') || result.error}`);
    }
    await updateTask(task, project, 'completed', {
      course_id: target.courseId,
      procurement_gate: result.procurement_gate,
      media,
      published: true,
    }, 'Canonical course publication completed after media readiness, governance, and authorized human review.');
    await db
      .from('agentic_build_runs')
      .update({ status: 'completed', completed_at: new Date().toISOString(), error: null })
      .eq('id', run.id);
    await db.from('agentic_build_projects').update({ status: 'completed' }).eq('id', project.id);
    return;
  }

  throw new Error(`Unsupported course agentic worker: ${task.worker}`);
}
