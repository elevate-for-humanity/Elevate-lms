/**
 * Hard schema validator for AI-generated course outlines.
 *
 * Called before any DB write. If validation fails, the route returns 422
 * and nothing is persisted. No silent fallbacks.
 *
 * Rules enforced:
 *   - All required top-level keys present
 *   - Exactly the declared module count (default 5)
 *   - Each module has 4–6 lessons (step_type = 'lesson')
 *   - order_index: sequential from 1, no gaps, no duplicates
 *   - All lesson slugs unique and slug-safe (lowercase, hyphens only)
 *   - Checkpoints present and placed after correct modules
 *   - Final exam: ≥25 questions, domain_blueprint present
 *   - Pass thresholds and eligibility criteria defined
 *   - No empty/stub learning_points, scenarios, or assessment questions
 *   - Minimum content length guards (no one-word answers)
 */

export interface AssessmentQuestion {
  question: string;
  choices: { a: string; b: string; c: string; d: string };
  correct: 'a' | 'b' | 'c' | 'd';
  rationale: string;
}

export interface CourseLesson {
  order_index: number;
  module_index: number;
  slug: string;
  title: string;
  step_type: 'lesson' | 'checkpoint' | 'exam';
  learning_points: string[];
  scenario: string;
  assessment_question: AssessmentQuestion;
}

export interface CourseModule {
  module_index: number;
  slug: string;
  title: string;
  description: string;
}

export interface CourseCheckpoint {
  after_module_index: number;
  slug: string;
  title: string;
  pass_threshold: number;
  competencies_tested: string[];
}

export interface ExamDomainBlueprint {
  domain: string;
  question_count: number;
  competencies: string[];
}

export interface CourseExam {
  slug: string;
  title: string;
  question_count: number;
  pass_threshold: number;
  domain_blueprint: ExamDomainBlueprint[];
}

export interface CourseOutlinePayload {
  course: {
    title: string;
    slug: string;
    description: string;
    total_hours: number;
    state: string;
    credential: string;
    pass_threshold_checkpoints: number;
    pass_threshold_final_exam: number;
    exam_eligibility_criteria: string[];
    compliance_status: 'draft_for_human_review'; // only valid value from AI output
  };
  modules: CourseModule[];
  lessons: CourseLesson[];
  checkpoints: CourseCheckpoint[];
  exams: CourseExam[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MIN_SCENARIO_LEN = 40;
const MIN_POINT_LEN = 10;
const MIN_QUESTION_LEN = 20;
const MIN_RATIONALE_LEN = 15;

export function validateCourseOutline(
  raw: unknown,
  opts: { expectedModuleCount?: number; expectedCheckpointAfter?: number[] } = {}
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const expectedModules = opts.expectedModuleCount ?? 5;
  const expectedCpAfter = opts.expectedCheckpointAfter ?? [2, 3, 4];

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { valid: false, errors: ['Payload is not an object'], warnings };
  }

  const p = raw as Record<string, unknown>;

  // ── Top-level keys ────────────────────────────────────────────
  for (const key of ['course', 'modules', 'lessons', 'checkpoints', 'exams']) {
    if (!(key in p)) errors.push(`Missing required key: "${key}"`);
  }
  if (errors.length) return { valid: false, errors, warnings };

  const course = p.course as Record<string, unknown>;
  const modules = p.modules as unknown[];
  const lessons = p.lessons as unknown[];
  const checkpoints = p.checkpoints as unknown[];
  const exams = p.exams as unknown[];

  // ── Course fields ─────────────────────────────────────────────
  for (const f of ['title', 'slug', 'description', 'state', 'credential']) {
    if (typeof course[f] !== 'string' || !(course[f] as string).trim()) {
      errors.push(`course.${f} is missing or empty`);
    }
  }
  if (typeof course.pass_threshold_checkpoints !== 'number') {
    errors.push('course.pass_threshold_checkpoints must be a number');
  }
  if (typeof course.pass_threshold_final_exam !== 'number') {
    errors.push('course.pass_threshold_final_exam must be a number');
  }
  if (!Array.isArray(course.exam_eligibility_criteria) || (course.exam_eligibility_criteria as unknown[]).length === 0) {
    errors.push('course.exam_eligibility_criteria must be a non-empty array');
  }
  // Compliance status — must always be draft_for_human_review.
  // "verified" is not a valid value from AI output — only a human reviewer can set that
  // directly in the DB. The validator rejects it to prevent AI self-certification.
  if (course.compliance_status !== 'draft_for_human_review') {
    errors.push('course.compliance_status must be "draft_for_human_review" — AI output cannot be self-certified as verified');
  }

  // ── Module count ──────────────────────────────────────────────
  if (!Array.isArray(modules) || modules.length !== expectedModules) {
    errors.push(`Expected exactly ${expectedModules} modules, got ${Array.isArray(modules) ? modules.length : 'non-array'}`);
  }

  // ── Module fields ─────────────────────────────────────────────
  const moduleIndices = new Set<number>();
  if (Array.isArray(modules)) {
    for (const [i, mod] of modules.entries()) {
      const m = mod as Record<string, unknown>;
      if (typeof m.module_index !== 'number') errors.push(`modules[${i}].module_index must be a number`);
      else moduleIndices.add(m.module_index as number);
      if (!SLUG_RE.test((m.slug as string) ?? '')) errors.push(`modules[${i}].slug "${m.slug}" is not slug-safe`);
      if (typeof m.title !== 'string' || !(m.title as string).trim()) errors.push(`modules[${i}].title is empty`);
    }
  }

  // ── Lessons ───────────────────────────────────────────────────
  if (!Array.isArray(lessons)) {
    errors.push('lessons must be an array');
  } else {
    const orderIndices: number[] = [];
    const slugsSeen = new Set<string>();

    for (const [i, lesson] of lessons.entries()) {
      const l = lesson as Record<string, unknown>;
      const ref = `lessons[${i}] (slug: ${l.slug ?? 'unknown'})`;

      // order_index
      if (typeof l.order_index !== 'number') {
        errors.push(`${ref}: order_index must be a number`);
      } else {
        orderIndices.push(l.order_index as number);
      }

      // slug
      const slug = l.slug as string;
      if (!SLUG_RE.test(slug ?? '')) {
        errors.push(`${ref}: slug "${slug}" is not slug-safe (lowercase, hyphens only)`);
      } else if (slugsSeen.has(slug)) {
        errors.push(`${ref}: duplicate slug "${slug}"`);
      } else {
        slugsSeen.add(slug);
      }

      // step_type
      if (!['lesson', 'checkpoint', 'exam'].includes(l.step_type as string)) {
        errors.push(`${ref}: step_type "${l.step_type}" is invalid`);
      }

      // learning_points — only required on lesson type
      if (l.step_type === 'lesson') {
        if (!Array.isArray(l.learning_points) || (l.learning_points as string[]).length < 3) {
          errors.push(`${ref}: learning_points must have at least 3 items`);
        } else {
          for (const pt of l.learning_points as string[]) {
            if (typeof pt !== 'string' || pt.trim().length < MIN_POINT_LEN) {
              errors.push(`${ref}: learning_point too short or empty: "${pt}"`);
            }
          }
        }

        // scenario
        if (typeof l.scenario !== 'string' || l.scenario.trim().length < MIN_SCENARIO_LEN) {
          errors.push(`${ref}: scenario too short (min ${MIN_SCENARIO_LEN} chars), got: "${String(l.scenario).substring(0, 60)}"`);
        }

        // assessment_question
        const aq = l.assessment_question as Record<string, unknown> | undefined;
        if (!aq) {
          errors.push(`${ref}: missing assessment_question`);
        } else {
          if (typeof aq.question !== 'string' || aq.question.trim().length < MIN_QUESTION_LEN) {
            errors.push(`${ref}: assessment_question.question too short`);
          }
          if (typeof aq.choices !== 'object' || !aq.choices) {
            errors.push(`${ref}: assessment_question.choices missing`);
          } else {
            const ch = aq.choices as Record<string, unknown>;
            for (const opt of ['a', 'b', 'c', 'd']) {
              if (typeof ch[opt] !== 'string' || !(ch[opt] as string).trim()) {
                errors.push(`${ref}: assessment_question.choices.${opt} is empty`);
              }
            }
          }
          if (!['a', 'b', 'c', 'd'].includes(aq.correct as string)) {
            errors.push(`${ref}: assessment_question.correct must be a, b, c, or d`);
          }
          if (typeof aq.rationale !== 'string' || aq.rationale.trim().length < MIN_RATIONALE_LEN) {
            errors.push(`${ref}: assessment_question.rationale too short`);
          }
        }
      }
    }

    // order_index: sequential from 1, no gaps, no duplicates
    const sorted = [...orderIndices].sort((a, b) => a - b);
    const dupes = sorted.filter((v, i) => sorted.indexOf(v) !== i);
    if (dupes.length > 0) errors.push(`Duplicate order_index values: ${dupes.join(', ')}`);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] > 1) {
        errors.push(`Gap in order_index: ${sorted[i - 1]} → ${sorted[i]}`);
      }
    }
    if (sorted[0] !== 1) errors.push(`order_index must start at 1, starts at ${sorted[0]}`);

    // Per-module lesson count: exactly 4 "lesson" rows per module.
    // Checkpoint and exam rows in the lessons array do NOT count toward this total.
    if (Array.isArray(modules)) {
      for (const mod of modules) {
        const m = mod as Record<string, unknown>;
        const modIdx = m.module_index as number;
        const modLessons = lessons.filter(
          (l) => (l as Record<string, unknown>).module_index === modIdx &&
                 (l as Record<string, unknown>).step_type === 'lesson'
        );
        if (modLessons.length < 4 || modLessons.length > 6) {
          errors.push(`Module ${modIdx} has ${modLessons.length} "lesson" rows (expected 4–6)`);
        }
      }
    }

    // Total row count sanity check: 20 lessons + 3 checkpoints + 1 exam = 24
    const totalExpected = 24;
    if (lessons.length !== totalExpected) {
      warnings.push(`lessons array has ${lessons.length} rows (expected ${totalExpected}: 20 lessons + 3 checkpoints + 1 exam)`);
    }

    // No checkpoint on module 1 or module 5 (only after 2, 3, 4)
    const badCpModules = lessons.filter(
      (l) => (l as Record<string, unknown>).step_type === 'checkpoint' &&
             ![2, 3, 4].includes((l as Record<string, unknown>).module_index as number)
    );
    if (badCpModules.length > 0) {
      errors.push(`Checkpoint rows found in wrong modules: ${badCpModules.map((l) => (l as Record<string, unknown>).module_index).join(', ')} (only allowed after modules 2, 3, 4)`);
    }
  }

  // ── Checkpoints ───────────────────────────────────────────────
  if (!Array.isArray(checkpoints) || checkpoints.length !== expectedCpAfter.length) {
    errors.push(`Expected ${expectedCpAfter.length} checkpoints, got ${Array.isArray(checkpoints) ? checkpoints.length : 'non-array'}`);
  } else {
    const cpAfter = checkpoints
      .map((c) => (c as Record<string, unknown>).after_module_index as number)
      .sort((a, b) => a - b);
    if (JSON.stringify(cpAfter) !== JSON.stringify([...expectedCpAfter].sort((a, b) => a - b))) {
      errors.push(`Checkpoints placed after modules [${cpAfter}], expected [${expectedCpAfter}]`);
    }
    for (const [i, cp] of checkpoints.entries()) {
      const c = cp as Record<string, unknown>;
      if (!SLUG_RE.test((c.slug as string) ?? '')) errors.push(`checkpoints[${i}].slug not slug-safe`);
      if (typeof c.pass_threshold !== 'number') errors.push(`checkpoints[${i}].pass_threshold must be a number`);
      if (!Array.isArray(c.competencies_tested) || (c.competencies_tested as unknown[]).length === 0) {
        errors.push(`checkpoints[${i}].competencies_tested must be a non-empty array`);
      }
    }
  }

  // ── Exams ─────────────────────────────────────────────────────
  if (!Array.isArray(exams) || exams.length === 0) {
    errors.push('exams must be a non-empty array');
  } else {
    const exam = exams[0] as Record<string, unknown>;
    if (typeof exam.question_count !== 'number' || (exam.question_count as number) < 25) {
      errors.push(`exam.question_count must be ≥25, got ${exam.question_count}`);
    }
    if (typeof exam.pass_threshold !== 'number') {
      errors.push('exam.pass_threshold must be a number');
    }
    if (!Array.isArray(exam.domain_blueprint) || (exam.domain_blueprint as unknown[]).length === 0) {
      errors.push('exam.domain_blueprint must be a non-empty array');
    } else {
      const totalQ = (exam.domain_blueprint as Record<string, unknown>[])
        .reduce((sum, d) => sum + ((d.question_count as number) ?? 0), 0);
      if (totalQ !== exam.question_count) {
        warnings.push(`domain_blueprint question_count sum (${totalQ}) does not match exam.question_count (${exam.question_count})`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
