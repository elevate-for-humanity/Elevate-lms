/**
 * lib/curriculum/blueprints/types.ts
 *
 * Single canonical type for the credential blueprint system.
 *
 * Every blueprint — HVAC, PRS, and any future program — uses this type.
 * Slugs are the durable identity. Titles are display text only.
 * The generator, builder, validator, and auditor all read from this type.
 *
 * Design notes:
 *   - `modules[].slug` is the identity key used by the generator (ModuleDef.slug).
 *   - `modules[].lessons` is the flat lesson list used by buildCourseFromBlueprint.
 *   - `modules[].competencies` and `requiredLessonTypes` are used by the auditor.
 *   - `assessmentRules` drives quiz/exam configuration per module and final.
 *   - `expectedModuleCount` / `expectedLessonCount` are validated at module load
 *     time by the hard-guard pattern in each blueprint file.
 */

// ─── Lesson reference (flat list consumed by buildCourseFromBlueprint) ────────

export type BlueprintLessonRef = {
  /** Stable slug — identity key, never change after seeding */
  slug: string;
  title: string;
  /** 1-based position within the module */
  order: number;
  /** credential_exam_domains.domain_key this lesson covers */
  domainKey: string;
  competencyKeys?: string[];
};

// ─── Competency requirement (consumed by auditor) ─────────────────────────────

export type BlueprintCompetency = {
  competencyKey: string;
  isCritical: boolean;
  /** Minimum number of lessons in this module that must cover this competency */
  minimumTouchpoints: number;
};

// ─── Lesson type requirement (consumed by auditor) ────────────────────────────

export type BlueprintLessonTypeRule = {
  lessonType: string;
  requiredCount: number;
};

// ─── Module definition ────────────────────────────────────────────────────────

export type BlueprintModule = {
  /**
   * Stable machine key — used as ModuleDef.slug by the generator.
   * Also used as the identity key by the auditor.
   * Never change after modules are seeded.
   */
  slug: string;
  title: string;
  /** 1-based position within the program */
  orderIndex: number;

  // ── Lesson bounds (enforced by auditor) ──
  minLessons: number;
  maxLessons: number;

  // ── Lesson type requirements (enforced by auditor) ──
  quizRequired: boolean;
  practicalRequired: boolean;
  isCritical: boolean;
  requiredLessonTypes: BlueprintLessonTypeRule[];

  // ── Competency coverage requirements (enforced by auditor) ──
  competencies: BlueprintCompetency[];

  /**
   * Suggested lesson titles for the AI generator.
   * Not enforced — generator may deviate within bounds.
   */
  suggestedLessonSkeleton: string[];

  /**
   * Flat lesson list consumed by buildCourseFromBlueprint.
   * Required for blueprints that pre-define exact lesson slugs (e.g. PRS Indiana).
   * Optional for generation-rules-only blueprints.
   */
  lessons?: BlueprintLessonRef[];

  /**
   * credential_exam_domains.domain_key for this module.
   * Used by buildCourseFromBlueprint when lessons[] is present.
   */
  domainKey?: string;
};

// ─── Assessment rules (consumed by auditor and quiz generator) ────────────────

export type BlueprintAssessmentRule = {
  assessmentType: 'module' | 'type_specific' | 'universal_review' | 'final';
  /** Module slug this rule applies to, or 'all' for program-wide rules */
  scope: string;
  minQuestions: number;
  maxQuestions: number;
  /** 0–1 decimal, e.g. 0.70 = 70% */
  passingThreshold: number;
  /**
   * Minimum fraction each domain must contribute to this assessment.
   * Keys are competencyKey or domain_key strings.
   */
  distributionConstraints?: Record<string, number>;
};

// ─── Generation rules ─────────────────────────────────────────────────────────

export type BlueprintGenerationRules = {
  allowRemediation: boolean;
  allowExpansionLessons: boolean;
  maxTotalLessons: number;
  requiresFinalExam: boolean;
  requiresUniversalReview: boolean;
  generatorMode: 'fixed' | 'flexible';
};

// ─── Canonical blueprint ──────────────────────────────────────────────────────

export type CredentialBlueprint = {
  /**
   * Stable machine ID — used by getBlueprintById().
   * Format: '{program}-{state}-v{n}', e.g. 'prs-indiana', 'hvac-epa608-v1'
   */
  id: string;
  version: string;

  /** credential_exam_domains parent credential slug */
  credentialSlug: string;
  credentialTitle: string;

  /** Two-letter state code, or 'federal' for federal credentials */
  state: string;

  /** programs.slug — links blueprint to the DB program row */
  programSlug: string;

  /** Short credential code for display, e.g. 'EPA-608', 'IN-PRS' */
  credentialCode: string;

  /** Exam track variants this program supports */
  trackVariants: string[];

  status: 'active' | 'draft' | 'archived';

  generationRules: BlueprintGenerationRules;

  /**
   * Hard counts validated at module load time by each blueprint file.
   * expectedLessonCount counts only lessons[] entries, not generated lessons.
   * Set to 0 for generation-rules-only blueprints that do not pre-define lessons.
   */
  expectedModuleCount: number;
  expectedLessonCount: number;

  modules: BlueprintModule[];

  assessmentRules: BlueprintAssessmentRule[];
};

// ─── Audit result types (consumed by auditor.ts) ──────────────────────────────

export type BlueprintAuditViolation = {
  severity: 'error' | 'warning';
  moduleSlug?: string;
  rule: string;
  detail: string;
};

export type BlueprintAuditResult = {
  blueprintSlug: string;
  passed: boolean;
  violations: BlueprintAuditViolation[];
  warnings: BlueprintAuditViolation[];
};
