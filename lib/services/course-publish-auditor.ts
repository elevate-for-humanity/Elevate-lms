/**
 * lib/services/course-publish-auditor.ts
 *
 * Brutal publish auditor. Returns a machine-readable defect list grouped by
 * severity. Publish is blocked when any fatal or blocking issue exists.
 *
 * Severity levels:
 *   fatal    — course cannot publish under any circumstances (missing identity, no lessons)
 *   blocking — course is structurally incomplete for accreditation (missing objectives,
 *              video without transcript, practical without evidence config, etc.)
 *   warning  — recommended but not required (short content, no materials listed, etc.)
 *
 * Usage:
 *   const audit = await auditCourseForPublish(courseId);
 *   if (!audit.publishable) { ... show audit.issues ... }
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import {
  ASSESSMENT_LESSON_TYPES,
  EVIDENCE_LESSON_TYPES,
  VIDEO_LESSON_TYPES,
  type LessonType,
} from '@/lib/curriculum/lesson-types';
import { extractInstructionalText } from '@/lib/curriculum/normalize-lesson-content';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuditSeverity = 'fatal' | 'blocking' | 'warning';

export interface AuditIssue {
  severity:   AuditSeverity;
  code:       string;
  entityType: 'course' | 'module' | 'lesson';
  entityId?:  string;
  entityName?: string;
  message:    string;
}

export interface CoursePublishAudit {
  courseId:    string;
  publishable: boolean;
  issues:      AuditIssue[];
  auditedAt:   string;
}

// ─── Auditor ──────────────────────────────────────────────────────────────────

export async function auditCourseForPublish(courseId: string): Promise<CoursePublishAudit> {
  const db = createAdminClient();
  const issues: AuditIssue[] = [];
  const add = (issue: AuditIssue) => issues.push(issue);

  // ── Fetch course ────────────────────────────────────────────────────────────
  const { data: course } = await db
    .from('courses')
    .select('id, title, slug, description, status')
    .eq('id', courseId)
    .maybeSingle();

  if (!course) {
    return {
      courseId, publishable: false, auditedAt: new Date().toISOString(),
      issues: [{ severity: 'fatal', code: 'COURSE_NOT_FOUND', entityType: 'course',
        message: `Course ${courseId} not found.` }],
    };
  }

  // ── Course-level checks ─────────────────────────────────────────────────────

  if (!course.title?.trim()) {
    add({ severity: 'fatal', code: 'COURSE_NO_TITLE', entityType: 'course',
      entityId: courseId, message: 'Course has no title.' });
  }
  if (!course.slug?.trim()) {
    add({ severity: 'fatal', code: 'COURSE_NO_SLUG', entityType: 'course',
      entityId: courseId, message: 'Course has no slug.' });
  }
  if (!course.description?.trim()) {
    add({ severity: 'blocking', code: 'COURSE_NO_DESCRIPTION', entityType: 'course',
      entityId: courseId, message: 'Course has no description.' });
  }

  // Course objectives
  const { data: courseObjectives } = await db
    .from('course_objectives')
    .select('id')
    .eq('course_id', courseId);

  if (!courseObjectives?.length) {
    add({ severity: 'blocking', code: 'COURSE_NO_OBJECTIVES', entityType: 'course',
      entityId: courseId, message: 'Course has no learning objectives.' });
  }

  // ── Fetch modules ───────────────────────────────────────────────────────────
  const { data: modules } = await db
    .from('course_modules')
    .select('id, title, order_index')
    .eq('course_id', courseId)
    .order('order_index');

  if (!modules?.length) {
    add({ severity: 'fatal', code: 'COURSE_NO_MODULES', entityType: 'course',
      entityId: courseId, message: 'Course has no modules.' });
    return finalize(courseId, issues);
  }

  // Duplicate module order indexes
  const moduleOrders = modules.map(m => m.order_index);
  if (new Set(moduleOrders).size !== moduleOrders.length) {
    add({ severity: 'blocking', code: 'DUPLICATE_MODULE_ORDER', entityType: 'course',
      entityId: courseId, message: 'Duplicate module order_index values detected.' });
  }

  // ── Fetch all lessons ───────────────────────────────────────────────────────
  const { data: lessons } = await db
    .from('course_lessons')
    .select(
      'id, slug, title, lesson_type, order_index, module_id, ' +
      'passing_score, quiz_questions, content, content_structured, ' +
      'video_file, video_transcript, video_runtime_seconds, ' +
      'requires_evidence, requires_signoff, requires_evaluator, ' +
      'is_required'
    )
    .eq('course_id', courseId);

  if (!lessons?.length) {
    add({ severity: 'fatal', code: 'COURSE_NO_LESSONS', entityType: 'course',
      entityId: courseId, message: 'Course has no lessons.' });
    return finalize(courseId, issues);
  }

  // Duplicate lesson slugs
  const slugs = lessons.map(l => l.slug);
  if (new Set(slugs).size !== slugs.length) {
    add({ severity: 'fatal', code: 'DUPLICATE_LESSON_SLUGS', entityType: 'course',
      entityId: courseId, message: 'Duplicate lesson slugs detected within course.' });
  }

  // Duplicate lesson order indexes
  const lessonOrders = lessons.map(l => l.order_index);
  if (new Set(lessonOrders).size !== lessonOrders.length) {
    add({ severity: 'blocking', code: 'DUPLICATE_LESSON_ORDER', entityType: 'course',
      entityId: courseId, message: 'Duplicate lesson order_index values detected.' });
  }

  // ── Fetch objectives/competencies in bulk ───────────────────────────────────
  const moduleIds = modules.map(m => m.id);
  const lessonIds = lessons.map(l => l.id);

  const [
    { data: moduleObjectives },
    { data: lessonObjectives },
    { data: moduleCompetencies },
    { data: lessonCompetencyMap },
    { data: practicalRequirements },
    { data: completionRules },
  ] = await Promise.all([
    db.from('module_objectives').select('module_id').in('module_id', moduleIds),
    db.from('lesson_objectives').select('lesson_id').in('lesson_id', lessonIds),
    db.from('module_competencies').select('module_id').in('module_id', moduleIds),
    db.from('lesson_competency_map').select('lesson_id').in('lesson_id', lessonIds),
    db.from('practical_requirements').select('lesson_id, required_hours, required_attempts, requires_evaluator_approval, rubric_json, instructions').in('lesson_id', lessonIds) as Promise<{ data: Array<{ lesson_id: string; instructions: string | null; requires_evaluator_approval: boolean; rubric_json: unknown[] | null }> | null }>,
    db.from('module_completion_rules').select('module_id').eq('course_id', courseId),
  ]);

  const moduleObjectiveSet   = new Set((moduleObjectives ?? []).map((r: any) => r.module_id));
  const lessonObjectiveSet   = new Set((lessonObjectives ?? []).map((r: any) => r.lesson_id));
  const moduleCompetencySet  = new Set((moduleCompetencies ?? []).map((r: any) => r.module_id));
  const lessonCompetencySet  = new Set((lessonCompetencyMap ?? []).map((r: any) => r.lesson_id));
  type PracticalReqRow = { lesson_id: string; instructions: string | null; requires_evaluator_approval: boolean; rubric_json: unknown[] | null };
  const practicalMap = new Map<string, PracticalReqRow>((practicalRequirements ?? []).map((r) => [r.lesson_id, r]));
  const completionRuleSet    = new Set((completionRules ?? []).map((r: any) => r.module_id));

  // ── Module-level checks ─────────────────────────────────────────────────────
  for (const mod of modules) {
    const modLessons = lessons.filter(l => l.module_id === mod.id);

    if (!mod.title?.trim()) {
      add({ severity: 'blocking', code: 'MODULE_NO_TITLE', entityType: 'module',
        entityId: mod.id, message: `Module (order ${mod.order_index}) has no title.` });
    }

    if (!modLessons.length) {
      add({ severity: 'fatal', code: 'MODULE_NO_LESSONS', entityType: 'module',
        entityId: mod.id, entityName: mod.title,
        message: `Module "${mod.title}" has no lessons.` });
    }

    if (!moduleObjectiveSet.has(mod.id)) {
      add({ severity: 'blocking', code: 'MODULE_NO_OBJECTIVES', entityType: 'module',
        entityId: mod.id, entityName: mod.title,
        message: `Module "${mod.title}" has no learning objectives.` });
    }

    if (!moduleCompetencySet.has(mod.id)) {
      add({ severity: 'blocking', code: 'MODULE_NO_COMPETENCIES', entityType: 'module',
        entityId: mod.id, entityName: mod.title,
        message: `Module "${mod.title}" has no competency mappings.` });
    }
  }

  // Module completion rules required when >1 module
  if (modules.length > 1) {
    for (const mod of modules.slice(1)) {
      if (!completionRuleSet.has(mod.id)) {
        add({ severity: 'blocking', code: 'MODULE_NO_COMPLETION_RULE', entityType: 'module',
          entityId: mod.id, entityName: mod.title,
          message: `Module "${mod.title}" has no completion/unlock rule (required when course has >1 module).` });
      }
    }
  }

  // ── Lesson-level checks ─────────────────────────────────────────────────────
  for (const lesson of lessons) {
    const lt = (lesson.lesson_type ?? 'reading') as LessonType;
    const name = lesson.title || lesson.slug || lesson.id;

    if (!lesson.title?.trim()) {
      add({ severity: 'fatal', code: 'LESSON_NO_TITLE', entityType: 'lesson',
        entityId: lesson.id, message: `Lesson (order ${lesson.order_index}) has no title.` });
    }
    if (!lesson.slug?.trim()) {
      add({ severity: 'fatal', code: 'LESSON_NO_SLUG', entityType: 'lesson',
        entityId: lesson.id, entityName: name,
        message: `Lesson "${name}" has no slug.` });
    }
    if (!lesson.lesson_type) {
      add({ severity: 'fatal', code: 'LESSON_NO_TYPE', entityType: 'lesson',
        entityId: lesson.id, entityName: name,
        message: `Lesson "${name}" has no lesson_type.` });
    }

    // Objectives required for all non-certification lessons
    if (lt !== 'certification' && !lessonObjectiveSet.has(lesson.id)) {
      add({ severity: 'blocking', code: 'LESSON_NO_OBJECTIVES', entityType: 'lesson',
        entityId: lesson.id, entityName: name,
        message: `Lesson "${name}" (${lt}) has no learning objectives.` });
    }

    // Content check — reading/assignment/lab must have instructional content
    if (['reading', 'lab', 'assignment', 'capstone'].includes(lt)) {
      const text = extractInstructionalText(lesson.content_structured ?? lesson.content);
      if (text.length < 50) {
        add({ severity: 'blocking', code: 'LESSON_EMPTY_CONTENT', entityType: 'lesson',
          entityId: lesson.id, entityName: name,
          message: `Lesson "${name}" (${lt}) has insufficient instructional content (< 50 chars).` });
      }
    }

    // Video lessons: require video_file + transcript + runtime
    if (VIDEO_LESSON_TYPES.includes(lt)) {
      if (!lesson.video_file?.trim()) {
        add({ severity: 'fatal', code: 'VIDEO_NO_FILE', entityType: 'lesson',
          entityId: lesson.id, entityName: name,
          message: `Video lesson "${name}" has no video_file.` });
      }
      if (!lesson.video_transcript?.trim()) {
        add({ severity: 'blocking', code: 'VIDEO_NO_TRANSCRIPT', entityType: 'lesson',
          entityId: lesson.id, entityName: name,
          message: `Video lesson "${name}" has no transcript.` });
      }
      if (!lesson.video_runtime_seconds || lesson.video_runtime_seconds === 0) {
        add({ severity: 'blocking', code: 'VIDEO_NO_RUNTIME', entityType: 'lesson',
          entityId: lesson.id, entityName: name,
          message: `Video lesson "${name}" has runtime_seconds = 0.` });
      }
    }

    // Assessment lessons: require quiz_questions + passing_score
    if (ASSESSMENT_LESSON_TYPES.includes(lt)) {
      const questions = lesson.quiz_questions;
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        add({ severity: 'fatal', code: 'ASSESSMENT_NO_QUESTIONS', entityType: 'lesson',
          entityId: lesson.id, entityName: name,
          message: `Assessment lesson "${name}" (${lt}) has no quiz_questions.` });
      }
      if (!lesson.passing_score || lesson.passing_score <= 0) {
        add({ severity: 'blocking', code: 'ASSESSMENT_NO_PASSING_SCORE', entityType: 'lesson',
          entityId: lesson.id, entityName: name,
          message: `Assessment lesson "${name}" (${lt}) has no passing_score.` });
      }
    }

    // Evidence-required lesson types: must have requires_evidence = true + practical_requirements row
    if (EVIDENCE_LESSON_TYPES.includes(lt)) {
      if (!lesson.requires_evidence) {
        add({ severity: 'blocking', code: 'PRACTICAL_NO_EVIDENCE_FLAG', entityType: 'lesson',
          entityId: lesson.id, entityName: name,
          message: `Practical lesson "${name}" (${lt}) has requires_evidence = false. Configure evidence before publishing.` });
      }

      const pr = practicalMap.get(lesson.id) ?? null;
      if (!pr) {
        add({ severity: 'blocking', code: 'PRACTICAL_NO_REQUIREMENTS_ROW', entityType: 'lesson',
          entityId: lesson.id, entityName: name,
          message: `Practical lesson "${name}" (${lt}) has no practical_requirements row.` });
      } else {
        if (!pr.instructions?.trim()) {
          add({ severity: 'blocking', code: 'PRACTICAL_NO_INSTRUCTIONS', entityType: 'lesson',
            entityId: lesson.id, entityName: name,
            message: `Practical lesson "${name}" (${lt}) has no instructions in practical_requirements.` });
        }
        if (pr.requires_evaluator_approval) {
          const rubric = Array.isArray(pr.rubric_json) ? pr.rubric_json : [];
          if (rubric.length === 0) {
            add({ severity: 'blocking', code: 'PRACTICAL_NO_RUBRIC', entityType: 'lesson',
              entityId: lesson.id, entityName: name,
              message: `Practical lesson "${name}" requires evaluator approval but has no rubric criteria.` });
          }
        }
      }

      // Competency mapping required for evaluated lessons
      if (!lessonCompetencySet.has(lesson.id)) {
        add({ severity: 'blocking', code: 'PRACTICAL_NO_COMPETENCY_MAP', entityType: 'lesson',
          entityId: lesson.id, entityName: name,
          message: `Practical lesson "${name}" (${lt}) has no competency mappings.` });
      }
    }
  }

  // ── Accreditation metadata checks ───────────────────────────────────────────
  const { data: meta } = await db
    .from('course_accreditation_metadata')
    .select('requires_final_exam, requires_practical, certificate_requires_practical')
    .eq('course_id', courseId)
    .maybeSingle();

  if (meta?.requires_final_exam) {
    const hasFinalExam = lessons.some(l => l.lesson_type === 'final_exam');
    if (!hasFinalExam) {
      add({ severity: 'blocking', code: 'MISSING_FINAL_EXAM', entityType: 'course',
        entityId: courseId, message: 'Course accreditation metadata requires a final_exam lesson, but none exists.' });
    }
  }

  if (meta?.requires_practical) {
    const hasPractical = lessons.some(l => EVIDENCE_LESSON_TYPES.includes(l.lesson_type as LessonType));
    if (!hasPractical) {
      add({ severity: 'blocking', code: 'MISSING_PRACTICAL', entityType: 'course',
        entityId: courseId, message: 'Course accreditation metadata requires a practical lesson, but none exists.' });
    }
  }

  return finalize(courseId, issues);
}

function finalize(courseId: string, issues: AuditIssue[]): CoursePublishAudit {
  const publishable = !issues.some(i => i.severity === 'fatal' || i.severity === 'blocking');
  return { courseId, publishable, issues, auditedAt: new Date().toISOString() };
}

/**
 * Persists the audit result to course_publish_audits and returns it.
 * Call this from the publish API route.
 */
export async function runAndPersistAudit(
  courseId: string,
  auditorUserId?: string
): Promise<CoursePublishAudit> {
  const audit = await auditCourseForPublish(courseId);

  try {
    const db = createAdminClient();
    await db.from('course_publish_audits').insert({
      course_id:   courseId,
      publishable: audit.publishable,
      issues_json: audit.issues,
      audited_by:  auditorUserId ?? null,
    });
  } catch (err) {
    logger.error('[course-publish-auditor] Failed to persist audit result', err);
  }

  return audit;
}
