/**
 * lib/course-builder/schema.ts
 *
 * Canonical types for the course builder pipeline.
 *
 * These types are the single source of truth for what a valid course looks like
 * before it enters the DB. The blueprint system (lib/curriculum/blueprints/)
 * maps into these types. The validator (lib/course-builder/validate.ts) enforces
 * them. The pipeline (lib/course-builder/pipeline.ts) runs both.
 *
 * Relationship to existing types:
 *   BlueprintLessonRef  → maps to CourseLesson (via blueprintLessonToCoursLesson)
 *   CredentialBlueprint → maps to CourseTemplate (via blueprintToCourseTemplate)
 *
 * The DB shape (course_lessons row) is the output of the pipeline, not this type.
 */

// ─── Lesson type enum ─────────────────────────────────────────────────────────

export const LESSON_TYPES = [
  'lesson',       // reading / theory — no quiz required
  'video',        // video-primary — no quiz required
  'quiz',         // standalone quiz — quiz + passing_score required
  'checkpoint',   // module gate — quiz + passing_score required
  'lab',          // hands-on practical — may require instructor sign-off
  'assignment',   // written/project — may require instructor sign-off
  'exam',         // final exam — quiz + passing_score required
  'certification',// credential pathway — final step
] as const;

export type LessonType = typeof LESSON_TYPES[number];

/** Lesson types that require quiz_questions + passing_score */
export const ASSESSED_LESSON_TYPES: LessonType[] = ['quiz', 'checkpoint', 'exam'];

/** Lesson types that require content (HTML body) */
export const CONTENT_LESSON_TYPES: LessonType[] = ['lesson', 'video', 'checkpoint', 'lab', 'assignment'];

/** Lesson types that may require instructor sign-off */
export const PRACTICAL_LESSON_TYPES: LessonType[] = ['lab', 'assignment'];

// ─── Quiz question ────────────────────────────────────────────────────────────

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  /** 0-based index of the correct option */
  correctAnswer: number;
  explanation?: string;
};

// ─── Competency check ─────────────────────────────────────────────────────────

export type CompetencyCheck = {
  /** Must match a key in COMPETENCY_REGISTRY */
  key: string;
  /** Human-readable label — pulled from registry if omitted */
  label?: string;
  requiresInstructorSignoff: boolean;
  isCritical?: boolean;
};

// ─── Course lesson ────────────────────────────────────────────────────────────

export type CourseLesson = {
  /** Stable slug — identity key, never change after seeding */
  slug: string;
  title: string;
  type: LessonType;
  /** 1-based position within the module */
  order: number;

  // ── Content ──────────────────────────────────────────────────────────────
  /** What the learner will be able to do after this lesson */
  learningObjectives: string[];
  /** Full lesson body as sanitized HTML — required for content lesson types */
  content?: string;
  /** URL to lesson video */
  videoUrl?: string;

  // ── Assessment ───────────────────────────────────────────────────────────
  /** Required for assessed lesson types */
  quizQuestions?: QuizQuestion[];
  /** 0–100, required for assessed lesson types */
  passingScore?: number;

  // ── Practical / sign-off ─────────────────────────────────────────────────
  /** True when this lesson requires instructor observation */
  practicalRequired?: boolean;
  /** Competency checks the instructor must approve — keys must be in registry */
  competencyChecks?: CompetencyCheck[];

  // ── Metadata ─────────────────────────────────────────────────────────────
  durationMinutes?: number;
  instructorNotes?: string;
  partnerExamCode?: string;
};

// ─── Course module ────────────────────────────────────────────────────────────

export type CourseModule = {
  /** Stable slug */
  slug: string;
  title: string;
  /** 1-based position within the course */
  order: number;
  lessons: CourseLesson[];
};

// ─── Course template ──────────────────────────────────────────────────────────

export type CourseTemplate = {
  /** programs.slug — must resolve to a course_id via PROGRAM_COURSE_MAP */
  programSlug: string;
  /** courses.slug */
  courseSlug: string;
  title: string;
  description?: string;
  modules: CourseModule[];
};

// ─── Program → course mapping ─────────────────────────────────────────────────
//
// Single source of truth for program slug → LMS course ID.
// Import from here — never hardcode course IDs in route files or blueprints.
// When a new program is seeded, add its mapping here.

export const PROGRAM_COURSE_MAP: Record<string, string> = {
  'barber-apprenticeship': '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17',
  'hvac-technician':       'f0593164-55be-5867-98e7-8a86770a8dd0',
};

/** Resolves a program slug to its canonical LMS course ID, or null if unmapped */
export function resolveCourseId(programSlug: string): string | null {
  return PROGRAM_COURSE_MAP[programSlug] ?? null;
}
