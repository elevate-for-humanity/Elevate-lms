// ─────────────────────────────────────────────────────────────────────────────
// Canonical course builder types.
// These are the locked schema definitions for all programs.
// Do not add values to enums without updating the verifier and all seeds.
// ─────────────────────────────────────────────────────────────────────────────

// State board exam domain — maps to written exam topic weights.
export type Domain =
  | 'SAFETY_SANITATION'       // 25% of barber written exam
  | 'HAIR_SCALP'              // 20% of barber written exam
  | 'TOOLS_EQUIPMENT'         // subset of haircutting domain
  | 'HAIRCUTTING'             // 25% of barber written exam
  | 'SHAVING'                 // practical exam component
  | 'CHEMICAL_SERVICES'       // 15% of barber written exam
  | 'BUSINESS_PROFESSIONAL'   // professional skills
  | 'STATE_BOARD_PREP';       // exam preparation

// DOL apprenticeship OJT category — determines how hours are credited.
export type OJTCategory =
  | 'THEORY'          // RTI (related technical instruction) — classroom/online
  | 'DEMONSTRATION'   // instructor-led demonstration
  | 'PRACTICAL'       // hands-on OJT at the shop
  | 'ASSESSMENT';     // checkpoint, quiz, or exam

// Competency check type — classifies what the check is testing.
export type CompetencyType =
  | 'PROCEDURE'   // step-by-step procedural execution
  | 'SAFETY'      // safety rule or stop condition
  | 'SANITATION'  // infection control or disinfection
  | 'TECHNIQUE'   // skill execution quality
  | 'KNOWLEDGE';  // factual recall or applied understanding

// ── Core structures ───────────────────────────────────────────────────────────

export interface CompetencyCheck {
  id: string;               // unique within the lesson, kebab-case
  type: CompetencyType;
  description: string;      // observable, measurable behavior
  required: boolean;        // true = hard fail if not demonstrated
}

export interface LessonSeed {
  slug: string;             // durable identifier — never change after seeding
  title: string;
  durationMin: number;      // minimum 10

  // Required structural fields
  domain: Domain;
  ojtCategory: OJTCategory;
  hoursCredit: number;      // durationMin / 60, rounded to nearest 0.25

  content: string;          // instructional body — markdown or plain text
  competencyChecks: CompetencyCheck[];  // minimum 3, at least 3 required: true
}

export interface CheckpointSeed {
  slug: string;
  title: string;
  durationMin: number;
  domain: Domain;
  ojtCategory: OJTCategory;
  hoursCredit: number;
  passingScore: number;     // 0–100
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  prompt: string;
  choices: string[];
  answerIndex: number;
  rationale: string;
}

export interface ModuleSeed {
  slug: string;
  title: string;
  order: number;            // 1-based, no gaps
  objective: string;
  lessons: LessonSeed[];
  checkpoint?: CheckpointSeed;
}

export interface CourseSeed {
  slug: string;
  title: string;
  hoursTotal: number;       // total RTI hours (sum of all lesson hoursCredit)
  modules: ModuleSeed[];
}

// ── Allowed enum values (used by verifier) ────────────────────────────────────

export const VALID_DOMAINS: Domain[] = [
  'SAFETY_SANITATION', 'HAIR_SCALP', 'TOOLS_EQUIPMENT',
  'HAIRCUTTING', 'SHAVING', 'CHEMICAL_SERVICES',
  'BUSINESS_PROFESSIONAL', 'STATE_BOARD_PREP',
];

export const VALID_OJT_CATEGORIES: OJTCategory[] = [
  'THEORY', 'DEMONSTRATION', 'PRACTICAL', 'ASSESSMENT',
];

export const VALID_COMPETENCY_TYPES: CompetencyType[] = [
  'PROCEDURE', 'SAFETY', 'SANITATION', 'TECHNIQUE', 'KNOWLEDGE',
];

// Required domains — verifier fails if any are absent from the course.
export const REQUIRED_DOMAINS: Domain[] = [
  'SAFETY_SANITATION',
  'HAIR_SCALP',
  'HAIRCUTTING',
  'SHAVING',
  'CHEMICAL_SERVICES',
  'BUSINESS_PROFESSIONAL',
  'STATE_BOARD_PREP',
];
