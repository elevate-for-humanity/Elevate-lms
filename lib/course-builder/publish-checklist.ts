/**
 * lib/course-builder/publish-checklist.ts
 *
 * The Elevate course build standard, evaluated PURELY from Course Builder
 * state (the ProgramBuilderTemplate the author is holding). It never reads
 * the database: every item here can be satisfied from inside the builder,
 * which is what keeps this checklist from repeating the learner-gate
 * failure mode (blocking on legacy NULL fields nobody could fill in).
 *
 * The checklist GUIDES, it does not wall: each unsatisfied item carries a
 * `fix` target so the builder UI can jump the author straight to the field
 * or lesson that needs attention. An owner can also publish anyway with an
 * explicit override acknowledgment (see publish-standard.ts), which routes
 * the acknowledged gaps to PARIS as repair items instead of burying them.
 *
 * Nothing here is retroactive: it is evaluated only when a course is
 * published or re-published from the builder.
 */
import type { BuilderLesson, ProgramBuilderTemplate } from './schema';

export type PublishFixTarget =
  | { section: 'alignment' }
  | { section: 'lessons'; lessonSlug: string }
  | { section: 'workbook' }
  | { section: 'simulation' };

export interface PublishChecklistItem {
  key: string;
  label: string;
  satisfied: boolean;
  /** What is missing (or, when satisfied, what was found). */
  detail: string;
  fix: PublishFixTarget;
}

export interface PublishOverride {
  acknowledged: true;
  note?: string;
}

const ASSESSED_LESSON_TYPES = new Set(['quiz', 'checkpoint', 'exam']);

function nonEmpty(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function lessonActivities(lesson: BuilderLesson) {
  return lesson.activities ?? [];
}

/** A lesson's own assessment is its required work (the LMS already gates it by passing score). */
export function lessonHasRequiredWork(lesson: BuilderLesson): boolean {
  if (ASSESSED_LESSON_TYPES.has(lesson.lessonType)) return true;
  if (lessonActivities(lesson).some((activity) => activity.required === true)) return true;
  if ((lesson.assignments ?? []).some((assignment) => assignment.required === true)) return true;
  return false;
}

export function lessonHasSimulation(lesson: BuilderLesson): boolean {
  return lessonActivities(lesson).some(
    (activity) => activity.type === 'simulation' && nonEmpty(activity.simulationId),
  );
}

export function templateLessons(template: ProgramBuilderTemplate): BuilderLesson[] {
  return (template.modules ?? []).flatMap((module) => module.lessons ?? []);
}

export function tuitionSatisfied(template: ProgramBuilderTemplate): boolean {
  const tuition = template.tuition;
  if (!tuition) return false;
  if (tuition.isFree === true) return true;
  return typeof tuition.costDollars === 'number' && tuition.costDollars > 0;
}

export function evaluatePublishChecklist(
  template: ProgramBuilderTemplate,
): PublishChecklistItem[] {
  const items: PublishChecklistItem[] = [];
  const regulatory = template.regulatory ?? ({} as ProgramBuilderTemplate['regulatory']);
  const alignment: PublishFixTarget = { section: 'alignment' };

  items.push({
    key: 'alignment.governing-body',
    label: 'Governing body',
    satisfied: nonEmpty(regulatory.governingBody),
    detail: nonEmpty(regulatory.governingBody)
      ? `Governing body: ${regulatory.governingBody}`
      : 'No governing body set (e.g. U.S. Department of Labor, Indiana PLA, EPA).',
    fix: alignment,
  });
  items.push({
    key: 'alignment.governing-standard',
    label: 'Governing standard / version',
    satisfied: nonEmpty(regulatory.governingStandardVersion),
    detail: nonEmpty(regulatory.governingStandardVersion)
      ? `Standard: ${regulatory.governingStandardVersion}`
      : 'No governing standard or test-plan version set.',
    fix: alignment,
  });
  items.push({
    key: 'alignment.compliance-profile',
    label: 'Compliance profile',
    satisfied: nonEmpty(regulatory.complianceProfileKey),
    detail: nonEmpty(regulatory.complianceProfileKey)
      ? `Compliance profile: ${regulatory.complianceProfileKey}`
      : 'No compliance profile selected.',
    fix: alignment,
  });
  items.push({
    key: 'alignment.credential',
    label: 'Credential target',
    satisfied: nonEmpty(template.credentialTarget),
    detail: nonEmpty(template.credentialTarget)
      ? `Credential target: ${template.credentialTarget}`
      : 'No credential target set for this course.',
    fix: alignment,
  });
  items.push({
    key: 'alignment.tuition',
    label: 'Tuition / fee',
    satisfied: tuitionSatisfied(template),
    detail: tuitionSatisfied(template)
      ? template.tuition?.isFree
        ? 'Tuition: explicitly free.'
        : `Tuition: $${template.tuition?.costDollars}`
      : 'No tuition set. Enter the tuition (or mark the course explicitly free).',
    fix: alignment,
  });
  items.push({
    key: 'alignment.soc-code',
    label: 'SOC code (O*NET)',
    satisfied: nonEmpty(template.socCode),
    detail: nonEmpty(template.socCode)
      ? `SOC code: ${template.socCode}`
      : 'No SOC code set. The government job feed is keyed off this code.',
    fix: alignment,
  });
  items.push({
    key: 'alignment.cip-code',
    label: 'CIP code',
    satisfied: nonEmpty(template.cipCode),
    detail: nonEmpty(template.cipCode)
      ? `CIP code: ${template.cipCode}`
      : 'No CIP code set for the program of study.',
    fix: alignment,
  });

  for (const lesson of templateLessons(template)) {
    const satisfied = lessonHasRequiredWork(lesson);
    items.push({
      key: `lesson-work.${lesson.slug}`,
      label: `Required work — "${lesson.title}"`,
      satisfied,
      detail: satisfied
        ? 'Lesson has required work (assessment, required activity, or required assignment).'
        : `Lesson "${lesson.title}" has no required activity or assignment yet. Add one in the builder so the lesson cannot be skipped.`,
      fix: { section: 'lessons', lessonSlug: lesson.slug },
    });
  }

  const workbookOk = nonEmpty(template.workbook?.workbookId);
  items.push({
    key: 'workbook.attached',
    label: 'Workbook attached',
    satisfied: workbookOk,
    detail: workbookOk
      ? `Workbook attached: ${template.workbook?.title || template.workbook?.slug || template.workbook?.workbookId}`
      : 'No workbook attached. Attach the course workbook so curriculum and workbook ship together.',
    fix: { section: 'workbook' },
  });

  if (template.handsOnTrade === true) {
    const simulationOk = templateLessons(template).some(lessonHasSimulation);
    items.push({
      key: 'simulation.attached',
      label: 'Hands-on simulation attached',
      satisfied: simulationOk,
      detail: simulationOk
        ? 'A simulation activity is attached to a lesson.'
        : 'This is a machine/equipment trade but no lesson has a simulation activity attached.',
      fix: { section: 'simulation' },
    });
  }

  return items;
}

export function missingPublishItems(
  template: ProgramBuilderTemplate,
): PublishChecklistItem[] {
  return evaluatePublishChecklist(template).filter((item) => !item.satisfied);
}
