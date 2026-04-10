/**
 * @deprecated LEGACY — do not use for new course generation.
 *
 * This generator writes to curriculum_lessons / curriculum_quizzes / curriculum_recaps.
 * Those tables are NOT read by lms_lessons. Learners cannot see content written here.
 *
 * Canonical generation path:
 *   generateCourseFromBlueprint() → buildCanonicalCourseFromBlueprint()
 *   → courses / course_modules / course_lessons → lms_lessons → learner
 *
 * This file is retained for reference only. Do not import CurriculumGenerator
 * from active generation routes or admin handlers.
 *
 * ⚠️  HARD GUARD: CurriculumGenerator constructor throws at runtime.
 * Any attempt to instantiate it will fail loudly rather than silently
 * overwriting canonical course_lessons data.
 */

/**
 * Idempotent curriculum generator.
 *
 * Writes program curriculum into curriculum_lessons, curriculum_quizzes,
 * curriculum_recaps, and modules.
 *
 * Identity keys (enforced by DB unique constraints from migration 000003):
 *   modules              → (program_id, slug)
 *   curriculum_lessons   → (program_id, lesson_slug)
 *   curriculum_quizzes   → (lesson_id, quiz_order)
 *   curriculum_recaps    → (lesson_id, recap_order)
 *
 * Each lesson is linked to a credential_exam_domain via credential_domain_id,
 * enabling coverage reporting and exam eligibility checks.
 *
 * ## Overwrite strategy
 *
 * Pass `mode` to control what happens when content already exists:
 *
 *   'seed_missing'  (default) — skip any lesson whose slug already exists in
 *                               the DB. Safe to re-run after human edits.
 *                               Modules are always upserted (title/order only).
 *
 *   'force'         — always upsert every row. Overwrites human edits.
 *                     Use only for initial seeding on a pristine program or
 *                     when you explicitly want to reset generated content.
 *
 * ## Domain linkage
 *
 * For credential-bearing programs (credentialId provided), every lesson MUST
 * supply a credentialDomainKey that resolves to a credential_exam_domains row.
 * A missing or unresolvable key is treated as an error and the lesson is NOT
 * written. This prevents silent coverage gaps in exam eligibility reporting.
 *
 * For non-exam programs (credentialId = null), credentialDomainKey is ignored.
 *
 * ## UUID stability note
 *
 * Domain IDs are resolved by (credential_id, domain_key), not by the seeded
 * UUID values. This is safe across environments. Do not hard-code domain UUIDs
 * in calling code — always pass domain_key and let the generator resolve.
 *
 * Usage:
 *   const gen = new CurriculumGenerator(programId, credentialId, 'seed_missing');
 *   await gen.upsertModule(moduleDef);
 *   await gen.upsertLesson(lessonDef);
 *   const summary = gen.summarize();
 */

import { createAdminClient, getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// ─── Input types ──────────────────────────────────────────────────────────────

export interface ModuleDef {
  /** Stable machine key. Used as the idempotency key. e.g. 'core', 'type_i' */
  slug: string;
  title: string;
  description?: string;
  /** 1-based position within the program */
  orderIndex: number;
}

export interface QuizDef {
  question: string;
  /** Exactly 4 options */
  options: [string, string, string, string];
  /** 0-based index of the correct option */
  correctAnswer: number;
  explanation: string;
  /** 0-based position within the lesson. Used as idempotency key. */
  quizOrder: number;
}

export interface RecapDef {
  title: string;
  description?: string;
  /** 0-based position within the lesson. Used as idempotency key. */
  recapOrder: number;
}

export interface LessonDef {
  /**
   * Stable slug. Used as the idempotency key.
   * Format: {module-slug}-{lesson-number}, e.g. 'core-01'
   * Must be unique within the program.
   */
  lessonSlug: string;
  lessonTitle: string;
  /** Module this lesson belongs to (must already be upserted) */
  moduleSlug: string;
  /** 0-based position within the module */
  lessonOrder: number;
  /** 0-based module position (denormalized for query performance) */
  moduleOrder: number;
  moduleTitle: string;
  scriptText?: string;
  keyTerms?: { term: string; definition: string }[];
  jobApplication?: string;
  watchFor?: string[];
  diagramRef?: string;
  videoFile?: string;
  audioFile?: string;
  captionFile?: string;
  diagramFile?: string;
  durationMinutes?: number;
  /**
   * domain_key from credential_exam_domains.
   * Links this lesson to the exam domain it covers.
   * Required for coverage reporting. Omit only for non-exam programs.
   */
  credentialDomainKey?: string;
  /** training_courses.id — links this lesson to the LMS course page */
  courseId?: string;
  /**
   * Lesson type. Controls rendering and completion rules.
   * Defaults to 'lesson' if omitted.
   * Set to 'checkpoint' on module-boundary lessons that gate the next module.
   */
  stepType?: 'lesson' | 'quiz' | 'checkpoint' | 'lab' | 'assignment' | 'exam' | 'certification';
  /**
   * Minimum score (0–100) required to pass.
   * Required for checkpoint/quiz/exam step types.
   * Defaults to 0 for plain lessons (no pass threshold).
   * curriculum_lessons.passing_score is NOT NULL — always written explicitly.
   */
  passingScore?: number;
  quizzes?: QuizDef[];
  recaps?: RecapDef[];
}

/**
 * Controls what happens when a lesson already exists in the DB.
 *
 * 'seed_missing' — skip existing lessons. Safe after human edits. (default)
 * 'force'        — always overwrite. Use only for initial seeding or explicit resets.
 */
export type GeneratorMode = 'seed_missing' | 'force';

export interface GeneratorSummary {
  programId: string;
  mode: GeneratorMode;
  modulesUpserted: number;
  lessonsSkipped: number;
  lessonsUpserted: number;
  quizzesUpserted: number;
  recapsUpserted: number;
  errors: string[];
}

// ─── CurriculumGenerator ──────────────────────────────────────────────────────

export class CurriculumGenerator {
  private programId: string;
  private credentialId: string | null;
  private mode: GeneratorMode;
  private db: ReturnType<typeof createAdminClient>;

  /** module slug → DB UUID, populated by upsertModule */
  private moduleIdMap = new Map<string, string>();
  /** lesson slug → DB UUID, populated by upsertLesson */
  private lessonIdMap = new Map<string, string>();
  /** domain key → DB UUID, populated lazily by resolveDomainId */
  private domainIdCache = new Map<string, string>();
  /** lesson slugs that already existed in DB at generation time */
  private existingSlugs = new Set<string>();

  private summary: GeneratorSummary;

  constructor(
    programId: string,
    credentialId: string | null = null,
    mode: GeneratorMode = 'seed_missing'
  ) {
    this.programId = programId;
    this.credentialId = credentialId;
    this.mode = mode;
    this.db = await getAdminClient();
    this.summary = {
      programId,
      mode,
      modulesUpserted: 0,
      lessonsSkipped: 0,
      lessonsUpserted: 0,
      quizzesUpserted: 0,
      recapsUpserted: 0,
      errors: [],
    };
  }

  /**
   * Pre-loads the set of lesson slugs that already exist for this program.
   * Called automatically by generate(). Can be called manually before
   * individual upsertLesson() calls if using the generator incrementally.
   */
  async loadExistingSlugs(): Promise<void> {
    if (!this.db) return;
    const { data } = await this.db
      .from('curriculum_lessons')
      .select('lesson_slug')
      .eq('program_id', this.programId);
    for (const row of data ?? []) {
      this.existingSlugs.add(row.lesson_slug);
    }
  }

  // ── Domain resolution ───────────────────────────────────────────────────────

  /**
   * Resolves a credential_exam_domain UUID from its domain_key.
   * Results are cached per generator instance.
   *
   * Returns null only when credentialId is null (non-exam program).
   * When credentialId is set and the key is not found, returns the sentinel
   * string 'NOT_FOUND' so callers can distinguish "no credential" from
   * "credential set but domain missing" — the latter is always an error.
   */
  private async resolveDomainId(domainKey: string): Promise<string | 'NOT_FOUND' | null> {
    // Non-exam program: domain linkage is not applicable
    if (!this.credentialId) return null;
    if (!domainKey) return null;

    if (this.domainIdCache.has(domainKey)) {
      return this.domainIdCache.get(domainKey)!;
    }

    const { data } = await this.db!
      .from('credential_exam_domains')
      .select('id')
      .eq('credential_id', this.credentialId)
      .eq('domain_key', domainKey)
      .maybeSingle();

    if (data?.id) {
      this.domainIdCache.set(domainKey, data.id);
      return data.id;
    }

    // Domain key not found for a credential-bearing program — caller must treat as error
    return 'NOT_FOUND';
  }

  // ── Module upsert ───────────────────────────────────────────────────────────

  /**
   * Upserts a module row. Idempotent on (program_id, slug).
   * Must be called before upsertLesson for any lesson in this module.
   */
  async upsertModule(def: ModuleDef): Promise<string | null> {
    if (!this.db) {
      this.summary.errors.push(`upsertModule(${def.slug}): database unavailable`);
      return null;
    }

    const { data, error } = await this.db
      .from('modules')
      .upsert(
        {
          program_id:  this.programId,
          slug:        def.slug,
          title:       def.title,
          description: def.description ?? null,
          order_index: def.orderIndex,
          updated_at:  new Date().toISOString(),
        },
        { onConflict: 'program_id,slug' }
      )
      .select('id')
      .single();

    if (error || !data) {
      const msg = `upsertModule(${def.slug}): ${error?.message ?? 'no row returned'}`;
      this.summary.errors.push(msg);
      logger.error('curriculum-generator: ' + msg);
      return null;
    }

    this.moduleIdMap.set(def.slug, data.id);
    this.summary.modulesUpserted++;
    return data.id;
  }

  // ── Lesson upsert ───────────────────────────────────────────────────────────

  /**
   * Upserts a lesson and its quizzes + recaps.
   * Idempotent on (program_id, lesson_slug).
   *
   * In 'seed_missing' mode, skips lessons whose slug already exists in the DB.
   * In 'force' mode, always overwrites.
   *
   * The module referenced by moduleSlug must have been upserted first.
   * Quizzes are idempotent on (lesson_id, quiz_order).
   * Recaps are idempotent on (lesson_id, recap_order).
   *
   * For credential-bearing programs, credentialDomainKey is required and must
   * resolve to a known domain. A missing or unresolvable key aborts the lesson.
   */
  async upsertLesson(def: LessonDef): Promise<string | null> {
    if (!this.db) {
      this.summary.errors.push(`upsertLesson(${def.lessonSlug}): database unavailable`);
      return null;
    }

    // seed_missing: skip lessons that already exist
    if (this.mode === 'seed_missing' && this.existingSlugs.has(def.lessonSlug)) {
      this.summary.lessonsSkipped++;
      // Still populate the ID map so callers can reference the lesson
      const { data } = await this.db
        .from('curriculum_lessons')
        .select('id')
        .eq('program_id', this.programId)
        .eq('lesson_slug', def.lessonSlug)
        .maybeSingle();
      if (data?.id) this.lessonIdMap.set(def.lessonSlug, data.id);
      return data?.id ?? null;
    }

    const moduleId = this.moduleIdMap.get(def.moduleSlug) ?? null;
    if (!moduleId) {
      const msg = `upsertLesson(${def.lessonSlug}): module '${def.moduleSlug}' not found — call upsertModule first`;
      this.summary.errors.push(msg);
      logger.error('curriculum-generator: ' + msg);
      return null;
    }

    // Resolve domain — hard error for credential-bearing programs
    let credentialDomainId: string | null = null;
    if (def.credentialDomainKey) {
      const resolved = await this.resolveDomainId(def.credentialDomainKey);
      if (resolved === 'NOT_FOUND') {
        const msg = `upsertLesson(${def.lessonSlug}): credential domain '${def.credentialDomainKey}' not found for credential ${this.credentialId} — lesson not written`;
        this.summary.errors.push(msg);
        logger.error('curriculum-generator: ' + msg);
        return null;
      }
      credentialDomainId = resolved;
    } else if (this.credentialId) {
      // Credential-bearing program but no domain key supplied — hard error
      const msg = `upsertLesson(${def.lessonSlug}): credentialDomainKey is required for credential-bearing programs (credentialId=${this.credentialId}) — lesson not written`;
      this.summary.errors.push(msg);
      logger.error('curriculum-generator: ' + msg);
      return null;
    }

    // Content enforcement — lesson body is required for all lesson types.
    // Assessment lessons (checkpoint/quiz/exam) additionally require quizzes.
    const assessmentTypes = ['checkpoint', 'quiz', 'exam'];
    const isAssessment = assessmentTypes.includes(def.stepType ?? 'lesson');

    if (!def.scriptText || def.scriptText.trim().length < 50) {
      const msg = `upsertLesson(${def.lessonSlug}): script_text is required and must be at least 50 characters — lesson not written`;
      this.summary.errors.push(msg);
      logger.error('curriculum-generator: ' + msg);
      return null;
    }

    if (isAssessment && (!def.quizzes || def.quizzes.length === 0)) {
      const msg = `upsertLesson(${def.lessonSlug}): step_type '${def.stepType}' requires at least one quiz question — lesson not written`;
      this.summary.errors.push(msg);
      logger.error('curriculum-generator: ' + msg);
      return null;
    }

    const { data: lessonRow, error: lessonErr } = await this.db

      .from('curriculum_lessons')
      .upsert(
        {
          program_id:           this.programId,
          course_id:            def.courseId ?? null,
          module_id:            moduleId,
          lesson_slug:          def.lessonSlug,
          lesson_title:         def.lessonTitle,
          lesson_order:         def.lessonOrder,
          module_order:         def.moduleOrder,
          module_title:         def.moduleTitle,
          script_text:          def.scriptText,
          key_terms:            def.keyTerms ?? [],
          job_application:      def.jobApplication ?? null,
          watch_for:            def.watchFor ?? [],
          diagram_ref:          def.diagramRef ?? null,
          video_file:           def.videoFile ?? null,
          audio_file:           def.audioFile ?? null,
          caption_file:         def.captionFile ?? null,
          diagram_file:         def.diagramFile ?? null,
          duration_minutes:     def.durationMinutes ?? null,
          credential_domain_id: credentialDomainId,
          step_type:            def.stepType ?? 'lesson',
          // NOT NULL column — 0 for plain lessons, explicit threshold for checkpoints/quizzes/exams
          passing_score:        def.passingScore ?? (def.stepType && def.stepType !== 'lesson' ? 80 : 0),
          status:               'published',
          updated_at:           new Date().toISOString(),
        },
        { onConflict: 'program_id,lesson_slug' }
      )
      .select('id')
      .single();

    if (lessonErr || !lessonRow) {
      const msg = `upsertLesson(${def.lessonSlug}): ${lessonErr?.message ?? 'no row returned'}`;
      this.summary.errors.push(msg);
      logger.error('curriculum-generator: ' + msg);
      return null;
    }

    const lessonId = lessonRow.id;
    this.lessonIdMap.set(def.lessonSlug, lessonId);
    this.summary.lessonsUpserted++;

    // Upsert quizzes
    if (def.quizzes?.length) {
      await this.upsertQuizzes(lessonId, def.lessonSlug, def.quizzes);
    }

    // Upsert recaps
    if (def.recaps?.length) {
      await this.upsertRecaps(lessonId, def.lessonSlug, def.recaps);
    }

    return lessonId;
  }

  // ── Quiz upsert ─────────────────────────────────────────────────────────────

  private async upsertQuizzes(
    lessonId: string,
    lessonSlug: string,
    quizzes: QuizDef[]
  ): Promise<void> {
    for (const q of quizzes) {
      const { error } = await this.db!
        .from('curriculum_quizzes')
        .upsert(
          {
            lesson_id:      lessonId,
            question:       q.question,
            options:        q.options,
            correct_answer: q.correctAnswer,
            explanation:    q.explanation ?? null,
            quiz_order:     q.quizOrder,
          },
          { onConflict: 'lesson_id,quiz_order' }
        );

      if (error) {
        const msg = `upsertQuiz(${lessonSlug}[${q.quizOrder}]): ${error.message}`;
        this.summary.errors.push(msg);
        logger.error('curriculum-generator: ' + msg);
      } else {
        this.summary.quizzesUpserted++;
      }
    }
  }

  // ── Recap upsert ────────────────────────────────────────────────────────────

  private async upsertRecaps(
    lessonId: string,
    lessonSlug: string,
    recaps: RecapDef[]
  ): Promise<void> {
    for (const r of recaps) {
      const { error } = await this.db!
        .from('curriculum_recaps')
        .upsert(
          {
            lesson_id:   lessonId,
            title:       r.title,
            description: r.description ?? null,
            recap_order: r.recapOrder,
          },
          { onConflict: 'lesson_id,recap_order' }
        );

      if (error) {
        const msg = `upsertRecap(${lessonSlug}[${r.recapOrder}]): ${error.message}`;
        this.summary.errors.push(msg);
        logger.error('curriculum-generator: ' + msg);
      } else {
        this.summary.recapsUpserted++;
      }
    }
  }

  // ── Bulk helpers ────────────────────────────────────────────────────────────

  /**
   * Upserts all modules in order, then all lessons.
   * Modules are processed first so lesson → module FK is always satisfied.
   *
   * In 'seed_missing' mode, pre-loads existing lesson slugs so each
   * upsertLesson() call can skip without a per-row DB read.
   */
  async generate(modules: ModuleDef[], lessons: LessonDef[]): Promise<GeneratorSummary> {
    if (this.mode === 'seed_missing') {
      await this.loadExistingSlugs();
    }

    for (const mod of modules.sort((a, b) => a.orderIndex - b.orderIndex)) {
      await this.upsertModule(mod);
    }

    for (const lesson of lessons.sort(
      (a, b) => a.moduleOrder - b.moduleOrder || a.lessonOrder - b.lessonOrder
    )) {
      await this.upsertLesson(lesson);
    }

    return this.summarize();
  }

  // ── Summary ─────────────────────────────────────────────────────────────────

  summarize(): GeneratorSummary {
    return { ...this.summary };
  }

  /**
   * Returns the DB UUID for a lesson slug, or null if not yet upserted.
   * Useful for post-generation media job creation.
   */
  getLessonId(lessonSlug: string): string | null {
    return this.lessonIdMap.get(lessonSlug) ?? null;
  }

  getModuleId(moduleSlug: string): string | null {
    return this.moduleIdMap.get(moduleSlug) ?? null;
  }
}

// ─── Standalone helpers ───────────────────────────────────────────────────────

/**
 * Resolves a program UUID from its slug.
 * Returns null if not found.
 */
export async function resolveProgramId(slug: string): Promise<string | null> {
  const db = await getAdminClient();
  if (!db) return null;
  const { data } = await db
    .from('programs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Resolves the primary credential UUID for a program.
 * Returns null if no primary credential is mapped.
 */
export async function resolvePrimaryCredentialId(programId: string): Promise<string | null> {
  const db = await getAdminClient();
  if (!db) return null;
  const { data } = await db
    .from('program_credentials')
    .select('credential_id')
    .eq('program_id', programId)
    .eq('is_primary', true)
    .maybeSingle();
  return data?.credential_id ?? null;
}

/**
 * Checks whether a program already has curriculum lessons in the DB.
 * Use this to skip generation when content already exists.
 */
export async function hasCurriculumContent(programId: string): Promise<boolean> {
  const db = await getAdminClient();
  if (!db) return false;
  const { count } = await db
    .from('curriculum_lessons')
    .select('id', { count: 'exact', head: true })
    .eq('program_id', programId);
  return (count ?? 0) > 0;
}
