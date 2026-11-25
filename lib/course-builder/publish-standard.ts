/**
 * lib/course-builder/publish-standard.ts
 *
 * Server-side glue for the Course Builder build standard:
 *
 * 1. `applyPublishStandard` — evaluates the publish checklist (pure, from
 *    builder state only; see publish-checklist.ts). Publishing is blocked
 *    ONLY when items are missing AND the publisher has not acknowledged
 *    them through the owner override. There is always a way through.
 *
 * 2. `recordPublishOverride` — an override is a routing, not a burial: the
 *    acknowledgment is written to the admin audit log, and the acknowledged
 *    gaps are handed to PARIS as a repair item through the platform's
 *    existing repair path (enqueueParisRepair → paris_code_repairs), so
 *    the root gaps get worked instead of quietly recurring.
 *
 * 3. `persistBuilderAlignment` / `persistBuilderAssignments` — round-trip:
 *    what the author put in the builder lands on the records the LMS reads.
 *    Alignment writes are best-effort (warn, never fail the publish),
 *    mirroring the job-feed evidence persistence in publishGovernedCourse.
 */
import type { SupabaseClient } from '../supabase';
import { logger } from '@/lib/logger';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import {
  missingPublishItems,
  type PublishChecklistItem,
  type PublishOverride,
} from './publish-checklist';
import { canonicalLessonSlug } from './publish-adapter';
import type { ProgramBuilderTemplate } from './schema';

export interface PublishStandardResult {
  missing: PublishChecklistItem[];
  /** True only when items are missing and no owner override was given. */
  blocked: boolean;
  overridden: boolean;
}

export function applyPublishStandard(
  template: ProgramBuilderTemplate,
  override?: PublishOverride | null,
): PublishStandardResult {
  const missing = missingPublishItems(template);
  const overridden = missing.length > 0 && override?.acknowledged === true;
  return { missing, blocked: missing.length > 0 && !overridden, overridden };
}

async function resolveParisActorId(
  db: SupabaseClient,
  preferredActorId?: string | null,
): Promise<string | null> {
  if (preferredActorId) return preferredActorId;
  try {
    const { data } = await db
      .from('paris_autopilot_policy')
      .select('actor_id')
      .eq('id', true)
      .maybeSingle();
    return (data as { actor_id?: string } | null)?.actor_id ?? null;
  } catch {
    return null;
  }
}

/**
 * Record an owner override: audit note + PARIS repair item for the gaps.
 * Never throws — routing the gaps must not break the publish itself.
 */
export async function recordPublishOverride(input: {
  db: SupabaseClient;
  template: ProgramBuilderTemplate;
  actorId?: string | null;
  missing: PublishChecklistItem[];
  note?: string;
}): Promise<{ auditRecorded: boolean; parisRepairId: string | null }> {
  const { template, missing } = input;
  const courseId = template.courseId ?? null;
  let auditRecorded = false;
  let parisRepairId: string | null = null;

  try {
    await logAdminAudit({
      action: AdminAction.COURSE_PUBLISHED,
      actorId: input.actorId ?? null,
      entityType: 'courses',
      entityId: courseId ?? template.slug,
      metadata: {
        publish_standard_override: {
          acknowledged: true,
          note: input.note ?? null,
          acknowledged_at: new Date().toISOString(),
          missing: missing.map((item) => ({ key: item.key, label: item.label, detail: item.detail })),
        },
      },
    });
    auditRecorded = true;
  } catch (error) {
    logger.warn('[course-builder] Could not write publish-override audit note', {
      courseSlug: template.slug,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const actorId = await resolveParisActorId(input.db, input.actorId);
    if (actorId) {
      const { enqueueParisRepair } = await import('@/lib/ai/runtime/code-repair');
      const gapList = missing.map((item) => `- ${item.label}: ${item.detail}`).join('\n');
      const receipt = await enqueueParisRepair({
        actorId,
        goal:
          `Course Builder build-standard gaps acknowledged at publish for "${template.title}" ` +
          `(slug: ${template.slug}${courseId ? `, course: ${courseId}` : ''}). ` +
          `Resolve each gap in the Course Builder and re-publish so the course meets the standard:\n${gapList}`,
        fingerprint: `course-publish-standard:${template.slug}:${missing
          .map((item) => item.key)
          .sort()
          .join(',')}`,
        candidate: {
          kind: 'course_publish_standard_gap',
          courseSlug: template.slug,
          courseId,
          overrideNote: input.note ?? null,
          missing: missing.map((item) => ({ key: item.key, label: item.label, detail: item.detail })),
        },
      });
      parisRepairId = (receipt as { id?: string } | null)?.id ?? null;
    } else {
      logger.warn('[course-builder] No PARIS actor available for publish-override routing', {
        courseSlug: template.slug,
      });
    }
  } catch (error) {
    logger.warn('[course-builder] Could not route publish-override gaps to PARIS', {
      courseSlug: template.slug,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return { auditRecorded, parisRepairId };
}

function nonEmpty(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Round-trip the builder's alignment values onto the records the LMS and
 * the public site read:
 *  - courses columns: tuition_cost, governing_body, governing_standard_version,
 *    compliance_profile_key (only values the template actually carries —
 *    a template that never held a field never wipes the record).
 *  - courses.metadata: socCode + cipCode + funding + tuition + workbook,
 *    merged with existing metadata (the builder's existing convention).
 *  - programs columns: soc_code / cip_code when the values are present.
 *  - digital_workbooks.program_id: the attached workbook is linked through
 *    the program, so course, curriculum, and workbook ship together —
 *    including for instructor access, which resolves through the program.
 */
export async function persistBuilderAlignment(
  db: SupabaseClient,
  template: ProgramBuilderTemplate,
): Promise<{ warnings: string[] }> {
  const warnings: string[] = [];
  const regulatory = template.regulatory;

  if (template.courseId) {
    try {
      const { data: existing } = await db
        .from('courses')
        .select('metadata')
        .eq('id', template.courseId)
        .maybeSingle();
      const metadata = {
        ...((existing?.metadata as Record<string, unknown> | null) ?? {}),
        socCode: template.socCode ?? null,
        cipCode: template.cipCode ?? null,
        funding: template.funding ?? null,
        tuition: template.tuition ?? null,
        workbook: template.workbook ?? null,
        handsOnTrade: template.handsOnTrade ?? false,
      };
      const update: Record<string, unknown> = { metadata };
      if (nonEmpty(regulatory?.governingBody)) update.governing_body = regulatory.governingBody;
      if (nonEmpty(regulatory?.governingStandardVersion))
        update.governing_standard_version = regulatory.governingStandardVersion;
      if (nonEmpty(regulatory?.complianceProfileKey))
        update.compliance_profile_key = regulatory.complianceProfileKey;
      if (template.tuition) {
        update.tuition_cost =
          template.tuition.isFree === true ? 0 : (template.tuition.costDollars ?? null);
      }
      const { error } = await db.from('courses').update(update).eq('id', template.courseId);
      if (error) throw error;
    } catch (error) {
      warnings.push(
        `course alignment write failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (template.programId) {
    try {
      const programUpdate: Record<string, unknown> = {};
      if (nonEmpty(template.socCode)) programUpdate.soc_code = template.socCode;
      if (nonEmpty(template.cipCode)) programUpdate.cip_code = template.cipCode;
      if (Object.keys(programUpdate).length > 0) {
        const { error } = await db.from('programs').update(programUpdate).eq('id', template.programId);
        if (error) throw error;
      }
    } catch (error) {
      warnings.push(
        `program alignment write failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (template.workbook?.workbookId) {
      try {
        const { error } = await db
          .from('digital_workbooks')
          .update({ program_id: template.programId })
          .eq('id', template.workbook.workbookId);
        if (error) throw error;
      } catch (error) {
        warnings.push(
          `workbook link failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  if (warnings.length) {
    logger.warn('[course-builder] Builder alignment persistence warnings', {
      courseSlug: template.slug,
      warnings,
    });
  }
  return { warnings };
}

/**
 * Round-trip builder-authored REQUIRED assignments into the assignments
 * table, linked to the published course_lessons rows, so the LMS no-skip
 * gate (lib/lms/lesson-requirements.ts) can require a learner submission
 * before the lesson completes. Presence in the assignments table is the
 * gate's "required" signal; optional authored assignments travel with the
 * lesson content instead. Idempotent: an existing (lesson, title) row is
 * left untouched on re-publish.
 */
export async function persistBuilderAssignments(
  db: SupabaseClient,
  template: ProgramBuilderTemplate,
  courseId: string,
): Promise<{ created: number; warnings: string[] }> {
  const warnings: string[] = [];
  let created = 0;
  try {
    const authored: Array<{ lessonSlug: string; title: string; instructions?: string; maxPoints?: number | null; submissionType?: string }> = [];
    for (const module of template.modules ?? []) {
      for (const lesson of module.lessons ?? []) {
        for (const assignment of lesson.assignments ?? []) {
          if (!assignment.required) continue;
          authored.push({
            lessonSlug: canonicalLessonSlug(lesson),
            title: assignment.title,
            instructions: assignment.instructions,
            maxPoints: assignment.maxPoints ?? null,
            submissionType: assignment.submissionType,
          });
        }
      }
    }
    if (authored.length === 0) return { created, warnings };

    const { data: lessonRows, error: lessonError } = await db
      .from('course_lessons')
      .select('id,slug')
      .eq('course_id', courseId);
    if (lessonError) throw lessonError;
    const lessonIdBySlug = new Map((lessonRows ?? []).map((row: any) => [row.slug, row.id]));

    for (const item of authored) {
      const lessonId = lessonIdBySlug.get(item.lessonSlug);
      if (!lessonId) {
        warnings.push(`assignment "${item.title}": published lesson not found for slug ${item.lessonSlug}`);
        continue;
      }
      const { data: existing } = await db
        .from('assignments')
        .select('id')
        .eq('lesson_id', lessonId)
        .eq('title', item.title)
        .maybeSingle();
      if (existing?.id) continue;
      const { error } = await db.from('assignments').insert({
        course_id: courseId,
        lesson_id: lessonId,
        title: item.title,
        instructions: item.instructions ?? null,
        max_points: item.maxPoints,
        points_possible: item.maxPoints,
        submission_type: item.submissionType ?? null,
      });
      if (error) {
        warnings.push(`assignment "${item.title}": ${error.message}`);
        continue;
      }
      created += 1;
    }
  } catch (error) {
    warnings.push(
      `assignment persistence failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (warnings.length) {
    logger.warn('[course-builder] Builder assignment persistence warnings', {
      courseSlug: template.slug,
      warnings,
    });
  }
  return { created, warnings };
}
