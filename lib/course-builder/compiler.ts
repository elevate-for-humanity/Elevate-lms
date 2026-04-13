/**
 * lib/course-builder/compiler.ts
 *
 * Plan-first curriculum compiler.
 *
 * The pipeline (pipeline.ts) writes what the blueprint declares.
 * The compiler expands blueprint rules into a full course plan — injecting
 * quizzes, labs, and a final exam where the module flags require them —
 * then validates the plan before any DB write.
 *
 * Sequence:
 *   1. parseBlueprint      — validate blueprint shape
 *   2. generateModulePlan  — expand each module's lesson list
 *   3. generateAssessmentPlan — inject quizzes where quizRequired=true
 *   4. generatePracticalPlan  — inject labs where practicalRequired=true
 *   5. injectFinalExam     — append exam when requiresFinalExam=true
 *   6. assignDurations     — fill duration_minutes via hours engine
 *   7. assignCompetencies  — attach competency keys from registry
 *   8. validatePlan        — run full validator; hard-fail on any error
 *   9. persistCoursePlan   — write to DB via pipeline
 *
 * Usage:
 *   import { compileBlueprintToCourse } from '@/lib/course-builder/compiler';
 *   const result = await compileBlueprintToCourse({ template, db });
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CourseTemplate,
  CourseModule,
  CourseLesson,
  FinalExamConfig,
} from './schema';
import { ASSESSED_LESSON_TYPES } from './schema';
import { getCompetenciesForProgram } from './competencies';
import { assignDuration } from './hours-engine';
import { validateCourseTemplate } from './validate';
import { runCoursePublishPipeline, type PipelineResult } from './pipeline';
import { logger } from '@/lib/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CompilerOptions = {
  template: CourseTemplate;
  db: SupabaseClient;
  /** 'missing-only' skips existing slugs; 'replace' wipes and re-seeds */
  mode?: 'missing-only' | 'replace';
  /** Validate and plan but do not write to DB */
  dryRun?: boolean;
};

export type GeneratedCoursePlan = {
  template: CourseTemplate;
  totalLessons: number;
  totalModules: number;
  injectedQuizzes: string[];
  injectedLabs: string[];
  injectedExam: boolean;
  estimatedHours: number;
  warnings: string[];
};

export type CompilerResult = {
  success: boolean;
  plan: GeneratedCoursePlan | null;
  pipelineResult: PipelineResult | null;
  errors: string[];
};

// ─── Step 1: Blueprint parse ──────────────────────────────────────────────────

function parseBlueprint(template: CourseTemplate): string[] {
  const errors: string[] = [];
  if (!template.programSlug) errors.push('programSlug is required');
  if (!template.courseSlug)  errors.push('courseSlug is required');
  if (!template.title)       errors.push('title is required');
  if (!template.modules?.length) errors.push('at least one module is required');
  if (template.requiresFinalExam && !template.finalExam) {
    errors.push('requiresFinalExam=true but finalExam config is missing');
  }
  if (template.finalExam?.domainDistribution) {
    const total = Object.values(template.finalExam.domainDistribution).reduce((s, v) => s + v, 0);
    if (Math.abs(total - 100) > 1) {
      errors.push(`finalExam.domainDistribution sums to ${total}, must be 100`);
    }
  }
  return errors;
}

// ─── Step 2: Module plan expansion ───────────────────────────────────────────

export function generateModulePlan(mod: CourseModule): CourseModule {
  // Ensure lessons are ordered
  const lessons = [...mod.lessons].sort((a, b) => a.order - b.order);
  return { ...mod, lessons };
}

// ─── Step 3: Assessment injection ────────────────────────────────────────────

export function generateAssessmentPlan(
  mod: CourseModule,
  injected: string[],
): CourseModule {
  if (!mod.quizRequired) return mod;

  // Already has a checkpoint or quiz — no injection needed
  const hasAssessment = mod.lessons.some(l =>
    ASSESSED_LESSON_TYPES.includes(l.type as typeof ASSESSED_LESSON_TYPES[number]),
  );
  if (hasAssessment) return mod;

  const questionCount = mod.quizQuestionCount ?? 8;
  const checkpointSlug = `${mod.slug}-checkpoint`;
  const maxOrder = Math.max(...mod.lessons.map(l => l.order), 0);

  const checkpoint: CourseLesson = {
    slug: checkpointSlug,
    title: `${mod.title} — Knowledge Check`,
    type: 'checkpoint',
    order: maxOrder + 1,
    learningObjectives: [`Demonstrate understanding of ${mod.title} concepts`],
    passingScore: 70,
    quizQuestions: Array.from({ length: questionCount }, (_, i) => ({
      id: `${checkpointSlug}-q${i + 1}`,
      question: `[Placeholder question ${i + 1} for ${mod.title}]`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      explanation: 'Placeholder — hydrate with assessment generator.',
    })),
    durationMinutes: 20,
    instructorNotes: `Auto-injected checkpoint for module "${mod.title}". Replace placeholder questions via the assessment generator.`,
  };

  injected.push(checkpointSlug);
  return { ...mod, lessons: [...mod.lessons, checkpoint] };
}

// ─── Step 4: Practical injection ─────────────────────────────────────────────

export function generatePracticalPlan(
  mod: CourseModule,
  injected: string[],
): CourseModule {
  if (!mod.practicalRequired) return mod;

  // Already has a lab or assignment — no injection needed
  const hasPractical = mod.lessons.some(l =>
    l.type === 'lab' || l.type === 'assignment',
  );
  if (hasPractical) return mod;

  const labSlug = `${mod.slug}-lab`;
  const maxOrder = Math.max(...mod.lessons.map(l => l.order), 0);

  const lab: CourseLesson = {
    slug: labSlug,
    title: `${mod.title} — Practical Exercise`,
    type: 'lab',
    order: maxOrder + 1,
    learningObjectives: [`Apply ${mod.title} skills in a supervised practical setting`],
    practicalRequired: true,
    competencyChecks: [],
    requiredArtifacts: ['checklist'],
    durationMinutes: 60,
    content: `<h2>${mod.title} — Practical Exercise</h2><p>Complete the practical exercise as directed by your instructor. Your instructor will observe and sign off on each competency check.</p>`,
    instructorNotes: `Auto-injected lab for module "${mod.title}". Add competency checks and rubric before publishing.`,
  };

  injected.push(labSlug);
  return { ...mod, lessons: [...mod.lessons, lab] };
}

// ─── Step 5: Final exam injection ─────────────────────────────────────────────

function injectFinalExam(
  template: CourseTemplate,
  examConfig: FinalExamConfig,
): CourseTemplate {
  const allLessons = template.modules.flatMap(m => m.lessons);
  const hasExam = allLessons.some(l => l.type === 'exam');
  if (hasExam) return template;

  const examSlug = `${template.courseSlug}-final-exam`;
  const lastMod = template.modules[template.modules.length - 1];

  const exam: CourseLesson = {
    slug: examSlug,
    title: 'Final Examination',
    type: 'exam',
    order: Math.max(...lastMod.lessons.map(l => l.order), 0) + 1,
    learningObjectives: ['Demonstrate mastery of all program competencies'],
    passingScore: examConfig.passingScore,
    quizQuestions: Array.from({ length: examConfig.questionCount }, (_, i) => ({
      id: `${examSlug}-q${i + 1}`,
      question: `[Placeholder exam question ${i + 1}]`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      explanation: 'Placeholder — hydrate with assessment generator.',
    })),
    durationMinutes: 90,
    instructorNotes: `Auto-injected final exam. Replace placeholder questions via the assessment generator. Domain distribution: ${JSON.stringify(examConfig.domainDistribution ?? {})}.`,
  };

  const updatedModules = template.modules.map((mod, idx) =>
    idx === template.modules.length - 1
      ? { ...mod, lessons: [...mod.lessons, exam] }
      : mod,
  );

  return { ...template, modules: updatedModules };
}

// ─── Step 6: Duration assignment ─────────────────────────────────────────────

function assignDurations(template: CourseTemplate): CourseTemplate {
  return {
    ...template,
    modules: template.modules.map(mod => ({
      ...mod,
      lessons: mod.lessons.map(lesson => ({
        ...lesson,
        durationMinutes: lesson.durationMinutes ?? assignDuration(lesson.type),
      })),
    })),
  };
}

// ─── Step 7: Competency assignment ───────────────────────────────────────────

export function assignCompetencies(
  template: CourseTemplate,
): CourseTemplate {
  const programCompetencies = getCompetenciesForProgram(template.programSlug);
  if (!programCompetencies.length) return template;

  // Build a map: domainKey → competency definitions
  const byDomain = new Map<string, typeof programCompetencies>();
  for (const comp of programCompetencies) {
    const key = comp.domainKey ?? '_unkeyed';
    if (!byDomain.has(key)) byDomain.set(key, []);
    byDomain.get(key)!.push(comp);
  }

  return {
    ...template,
    modules: template.modules.map(mod => ({
      ...mod,
      lessons: mod.lessons.map(lesson => {
        // Only attach to practical lessons that don't already have checks
        if (lesson.type !== 'lab' && lesson.type !== 'assignment') return lesson;
        if (lesson.competencyChecks?.length) return lesson;

        // Attach competencies matching the module's domain
        const domainComps = byDomain.get(mod.domainKey ?? '_unkeyed') ?? [];
        if (!domainComps.length) return lesson;

        return {
          ...lesson,
          competencyChecks: domainComps.map(c => ({
            key: c.key,
            label: c.label,
            requiresInstructorSignoff: c.requiresInstructorSignoff,
            isCritical: c.isCritical,
            assessmentMethod: c.assessmentMethod,
            domainKey: c.domainKey,
          })),
          practicalRequired: true,
        };
      }),
    })),
  };
}

// ─── Step 8: Plan validation ──────────────────────────────────────────────────

export function validatePlan(plan: CourseTemplate): { valid: boolean; errors: string[] } {
  const result = validateCourseTemplate(plan);
  return {
    valid: result.valid,
    errors: result.errors.map(e => `${e.moduleSlug}/${e.lessonSlug} [${e.field}]: ${e.message}`),
  };
}

// ─── Main compiler ────────────────────────────────────────────────────────────

export async function compileBlueprintToCourse(
  opts: CompilerOptions,
): Promise<CompilerResult> {
  const { db, mode = 'missing-only', dryRun = false } = opts;
  let template = { ...opts.template };

  // Step 1: Parse
  const parseErrors = parseBlueprint(template);
  if (parseErrors.length) {
    return { success: false, plan: null, pipelineResult: null, errors: parseErrors };
  }

  const injectedQuizzes: string[] = [];
  const injectedLabs: string[] = [];
  const warnings: string[] = [];

  // Steps 2–4: Expand modules
  template = {
    ...template,
    modules: template.modules.map(mod => {
      let expanded = generateModulePlan(mod);
      expanded = generateAssessmentPlan(expanded, injectedQuizzes);
      expanded = generatePracticalPlan(expanded, injectedLabs);
      return expanded;
    }),
  };

  // Step 5: Final exam
  let injectedExam = false;
  if (template.requiresFinalExam && template.finalExam) {
    const before = template.modules.flatMap(m => m.lessons).filter(l => l.type === 'exam').length;
    template = injectFinalExam(template, template.finalExam);
    const after = template.modules.flatMap(m => m.lessons).filter(l => l.type === 'exam').length;
    injectedExam = after > before;
  }

  // Step 6: Durations
  template = assignDurations(template);

  // Step 7: Competencies
  template = assignCompetencies(template);

  // Compute plan stats
  const allLessons = template.modules.flatMap(m => m.lessons);
  const estimatedHours = allLessons.reduce((s, l) => s + (l.durationMinutes ?? 0), 0) / 60;

  // Hours gate
  if (template.minimumHours && estimatedHours < template.minimumHours) {
    warnings.push(
      `Estimated hours (${estimatedHours.toFixed(1)}) below minimumHours (${template.minimumHours}). Add more lessons or increase durations.`,
    );
  }

  const plan: GeneratedCoursePlan = {
    template,
    totalLessons: allLessons.length,
    totalModules: template.modules.length,
    injectedQuizzes,
    injectedLabs,
    injectedExam,
    estimatedHours,
    warnings,
  };

  // Step 8: Validate
  const { valid, errors: validationErrors } = validatePlan(template);
  if (!valid) {
    logger.error('[compiler] Plan validation failed', {
      courseSlug: template.courseSlug,
      errorCount: validationErrors.length,
    });
    return { success: false, plan, pipelineResult: null, errors: validationErrors };
  }

  if (warnings.length) {
    logger.warn('[compiler] Plan warnings', { courseSlug: template.courseSlug, warnings });
  }

  // Step 9: Persist
  const pipelineResult = await runCoursePublishPipeline({ template, db, mode, dryRun });

  if (!pipelineResult.success) {
    return {
      success: false,
      plan,
      pipelineResult,
      errors: pipelineResult.errors,
    };
  }

  logger.info('[compiler] Course compiled and persisted', {
    courseSlug: template.courseSlug,
    totalLessons: plan.totalLessons,
    estimatedHours: plan.estimatedHours.toFixed(1),
    injectedQuizzes: injectedQuizzes.length,
    injectedLabs: injectedLabs.length,
    injectedExam,
  });

  return { success: true, plan, pipelineResult, errors: [] };
}
