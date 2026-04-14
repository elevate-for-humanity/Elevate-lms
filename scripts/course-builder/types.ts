// ─────────────────────────────────────────────────────────────────────────────
// Barber seed types — used by scripts/course-builder/ only.
//
// NOT the canonical course builder types. For the compiler pipeline use:
//   lib/course-builder/schema.ts       — CourseTemplate, CourseModule, CourseLesson
//   lib/curriculum/blueprints/types.ts — CredentialBlueprint
//
// These types represent the barber-specific seed shape that predates the
// compiler pipeline. Do not use for new programs.
// ─────────────────────────────────────────────────────────────────────────────

// ── State board exam domains (Indiana barber written exam) ────────────────────
export type BarberDomain =
  | 'infection_control'   // 25% of written exam
  | 'haircutting'         // 25% of written exam
  | 'shaving'             // part of haircutting/practical
  | 'chemical_services'   // 15% of written exam
  | 'laws_rules'          // 15% of written exam
  | 'consultation'        // embedded in hair science (20%)
  | 'hair_science'        // 20% of written exam
  | 'business'            // professional skills
  | 'exam_prep';          // module 8

// ── OJT categories (DOL apprenticeship hour tracking) ────────────────────────
export type OJTCategory =
  | 'sanitation'          // infection control OJT
  | 'cutting'             // haircutting OJT
  | 'shaving'             // shaving/beard OJT
  | 'chemical'            // chemical services OJT
  | 'client_service'      // consultation, communication
  | 'shop_ops'            // business, professional skills
  | 'theory';             // RTI (related technical instruction)

// ── Competency check (hard pass/fail) ────────────────────────────────────────
export type CompetencyCheck = {
  id: string;
  description: string;
  required: boolean;
};

// ── Lesson section types ──────────────────────────────────────────────────────
export type LessonSectionSeed =
  | { type: 'text';    heading: string; body: string[] }
  | { type: 'steps';   heading: string; steps: string[] }
  | { type: 'table';   heading: string; rows: { label: string; value: string }[] }
  | { type: 'callout'; heading: string; tone: 'info' | 'warning' | 'exam' | 'tip'; body: string[] };

export type GlossaryItem = {
  term: string;
  definition: string;
};

export type QuizQuestionSeed = {
  prompt: string;
  choices: string[];
  answerIndex: number;
  rationale?: string;
};

export type QuizSeed = {
  passingScore?: number;
  questions: QuizQuestionSeed[];
};

// ── Lesson seed ───────────────────────────────────────────────────────────────
export type LessonSeed = {
  slug: string;
  title: string;
  lessonOrder: number;
  durationMin: number;
  objective: string;

  // State board alignment — REQUIRED
  domain: BarberDomain;

  // Apprenticeship hour tracking — REQUIRED
  ojtCategory: OJTCategory;
  hoursCredit: number;

  // Optional metadata
  lessonType?: 'lesson' | 'checkpoint';
  style?: 'standard' | 'procedure' | 'theory' | 'practical' | 'safety' | 'exam-prep';
  tools?: string[];
  materials?: string[];
  vocabulary?: GlossaryItem[];
  safetyNotes?: string[];
  sanitationNotes?: string[];
  stateBoardFocus?: string[];
  miladyAlignment?: string[];

  sections: LessonSectionSeed[];

  // Hard pass/fail competency checks — minimum 3 with required: true
  competencyChecks: CompetencyCheck[];

  quiz?: QuizSeed;
};

// ── Checkpoint seed ───────────────────────────────────────────────────────────
export type CheckpointSeed = {
  slug: string;
  title: string;
  lessonOrder: number;
  durationMin: number;
  objective: string;
  domain: BarberDomain;
  ojtCategory: OJTCategory;
  hoursCredit: number;
  instructions: string[];
  rubric: string[];
  quiz?: QuizSeed;
};

// ── Module seed ───────────────────────────────────────────────────────────────
export type ModuleSeed = {
  slug: string;
  title: string;
  moduleOrder: number;
  objective?: string;
  lessons: LessonSeed[];
  checkpoint?: CheckpointSeed;
};

// ── Course seed ───────────────────────────────────────────────────────────────
export type CourseSeed = {
  courseSlug: string;
  courseTitle: string;
  modules: ModuleSeed[];
};

// ── Audit result ──────────────────────────────────────────────────────────────
export type CourseAuditResult = {
  totalLessons: number;
  totalHours: number;
  domainCoverage: Partial<Record<BarberDomain, number>>;
  ojtCoverage: Partial<Record<OJTCategory, number>>;
  missingDomains: BarberDomain[];
  warnings: string[];
  errors: string[];
  pass: boolean;
};
