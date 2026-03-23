/**
 * lib/curriculum/types.ts
 *
 * Shared types for the curriculum lesson pipeline:
 * generator → validator → publish → lms_lessons view → learner path.
 *
 * These types describe the lesson contract that flows through the pipeline.
 * The canonical DB table is course_lessons. The lms_lessons view reads
 * course_lessons. curriculum_lessons is legacy — do not write to it.
 */

// ─── Lesson contract (what the generator produces) ────────────────────────────

export interface LessonContract {
  /** Unique slug within a program. Format: {module-slug}-{lesson-n} */
  lesson_slug: string;
  lesson_title: string;
  lesson_order: number;
  module_order: number;
  module_title: string;

  /** Full lesson body. Maps to the content field in course_lessons on publish. */
  script_text: string;

  /** 1–3 sentence summary for learner preview and audit scoring */
  summary_text: string;

  /** Open-ended reflection question at end of lesson */
  reflection_prompt: string;

  /**
   * Competency keys this lesson claims to cover.
   * Must match keys in competency_exam_profiles.
   * Max 3 per lesson (enforced by validator — concept stuffing penalty).
   */
  competency_keys: string[];

  /**
   * Structured key terms for glossary rendering.
   * Shape: [{ term: string; definition: string }]
   */
  key_terms: KeyTerm[];

  duration_minutes: number;
  status: 'draft' | 'published';

  // Optional FK references — set during publish
  program_id?: string;
  course_id?: string;
  module_id?: string;
  credential_domain_id?: string;
}

export interface KeyTerm {
  term: string;
  definition: string;
}

// ─── Validation result ────────────────────────────────────────────────────────

export interface LessonValidationResult {
  lessonSlug: string;
  lessonTitle: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  scores: {
    completeness: number;   // 0–1
    competencyFidelity: number; // 0–1 (average across claimed competencies)
    examRelevance: number;  // 0–1
  };
}

// ─── Audit result (content-level, from audit-alignment.ts) ───────────────────

export interface LessonAuditResult {
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  passed: boolean;
  competencyResults: CompetencyAuditResult[];
  overallFidelityScore: number;
  examRelevanceScore: number;
  stuffingPenaltyApplied: boolean;
}

export interface CompetencyAuditResult {
  competencyKey: string;
  competencyName: string;
  phraseClusterDetected: boolean;
  distinctionTaught: boolean;
  distractorAvoided: boolean;
  passes: boolean;
}

// ─── Publish input ────────────────────────────────────────────────────────────

/**
 * What the publish route writes into course_lessons.
 * Extends LessonContract with resolved FK IDs.
 */
export interface PublishableLessonRow extends LessonContract {
  program_id: string;
  course_id: string;
}

// ─── Generator batch output ───────────────────────────────────────────────────

export interface GeneratedLessonBatch {
  programSlug: string;
  credentialCode: string;
  generatedAt: string;
  lessons: LessonContract[];
  /** Competency keys that have no lesson coverage — should be zero before publish */
  uncoveredCompetencies: string[];
}
