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
//
// Production contract: a lesson ref MUST carry the full instructional payload
// required for its step_type before the seeder will insert a DB row.
//
// Required by step_type:
//   lesson      — content (HTML) + objective
//   checkpoint  — content (HTML) + objective + quizQuestions (≥5) + passingScore
//   quiz/exam   — quizQuestions (≥5) + passingScore
//   lab         — content (HTML) + objective
//   assignment  — content (HTML) + objective
//
// If any required field is absent, the seeder logs the exact missing fields
// and skips the lesson entirely. No draft shell is created.

export type BlueprintQuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
};

export type BlueprintLessonRef = {
  /** Stable slug — identity key, never change after seeding */
  slug: string;
  title: string;
  /** 1-based position within the module */
  order: number;
  /** credential_exam_domains.domain_key this lesson covers */
  domainKey: string;
  competencyKeys?: string[];

  // ── Production content payload ──────────────────────────────────────
  // Required fields vary by step_type (inferred from slug suffix).
  // The seeder validates these before inserting. Missing = no row created.

  /** What the learner will be able to do after this lesson */
  objective?: string;

  /**
   * Full lesson body as sanitized HTML.
   * Required for: lesson, checkpoint, lab, assignment.
   * Must be > 200 characters of visible text after stripping tags.
   */
  content?: string;

  /**
   * Quiz/checkpoint questions.
   * Required for: checkpoint, quiz, exam.
   * Minimum 5 questions per lesson.
   */
  quizQuestions?: BlueprintQuizQuestion[];

  /**
   * Minimum passing score (0–100).
   * Required for: checkpoint, quiz, exam.
   */
  passingScore?: number;

  /** Duration hint in minutes — used for display only, not validated */
  durationMinutes?: number;

  /**
   * Certiport or external exam code.
   * Required for exam lessons that use an external proctoring system.
   */
  partnerExamCode?: string;
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

// ─── Video config (locked into blueprint — drives automatic generation) ───────

export type BlueprintVideoConfig = {
  /**
   * Layout template to use for all lesson videos in this program.
   * 'elevate-slide' = dark navy + orange top bar + DALL-E image bottom-left
   *                   + bullet points + instructor name. Matches HVAC template.
   */
  template: 'elevate-slide' | 'talking-head' | 'screencast' | 'custom';

  /** Avatar/instructor identity */
  instructorName: string;
  instructorTitle: string;
  /** Path relative to /public */
  instructorImagePath: string;

  /** Brand colors */
  topBarColor: string;       // e.g. '#f97316'
  accentColor: string;       // e.g. '#3b82f6'
  backgroundColor: string;   // e.g. '#0f172a'

  /** Voice for TTS narration */
  ttsVoice: 'onyx' | 'alloy' | 'echo' | 'fable' | 'nova' | 'shimmer';
  ttsSpeed: number;          // 0.25–4.0, default 0.85

  /** Number of slides per lesson video */
  slideCount: 5;

  /** Slide segment labels in order */
  segments: ['intro', 'concept', 'visual', 'application', 'wrapup'];

  /** Generate a DALL-E image per lesson for the bottom-left thumbnail */
  generateDalleImage: boolean;
  dalleImageStyle: 'natural' | 'vivid';

  /** Output resolution */
  width: 1920;
  height: 1080;
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

  /**
   * Locked video format for this program.
   * The course generator reads this and stores it on course_lessons.
   * The video generation service reads it to produce consistent videos
   * without manual configuration per lesson.
   */
  videoConfig?: BlueprintVideoConfig;

  /**
   * Where the seeder reads lesson content (script_text), quiz_questions,
   * passing_score, and step_type from.
   *
   * 'blueprint'           — content is embedded in lessons[].content /
   *                         quizQuestions / passingScore (default for new programs).
   *                         The production-content gate enforces all required fields.
   *
   * 'curriculum_lessons'  — content lives in the curriculum_lessons table, keyed
   *                         by lesson_slug = lessons[].slug. The seeder fetches it
   *                         at seed time and writes it into course_lessons.
   *                         The production-content gate is bypassed for these rows
   *                         because content is authoritative in the DB, not the file.
   *                         step_type is also read from curriculum_lessons.step_type
   *                         rather than inferred from the slug suffix.
   *
   * Defaults to 'blueprint' when omitted.
   */
  contentSource?: 'blueprint' | 'curriculum_lessons';
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
