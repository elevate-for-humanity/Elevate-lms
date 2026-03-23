/**
 * lib/curriculum/lesson-types.ts
 *
 * Canonical lesson type constants. Single source of truth for all lesson type
 * values used across the DB enum, builder UI, renderer, auditor, and blueprints.
 *
 * DB enum: public.lesson_type (course_lessons.lesson_type)
 * Legacy:  public.step_type_enum (curriculum_lessons.step_type) — aligned values
 */

// ─── Canonical lesson type union ─────────────────────────────────────────────

export type LessonType =
  | 'reading'       // text/rich-content lesson (replaces old 'lesson')
  | 'video'         // first-class video module — requires file + transcript + runtime
  | 'quiz'          // knowledge check quiz
  | 'checkpoint'    // module-boundary gate quiz
  | 'lab'           // hands-on lab with evidence submission
  | 'assignment'    // written/project assignment with evidence submission
  | 'simulation'    // interactive scenario simulation
  | 'practicum'     // supervised practical with hours/attempts tracking
  | 'externship'    // externship block with hour tracking
  | 'clinical'      // clinical shift with hour tracking
  | 'observation'   // observation log
  | 'final_exam'    // final exam (replaces old 'exam')
  | 'capstone'      // capstone project with rubric + evaluator review
  | 'certification'; // completion/certificate screen

export const ALL_LESSON_TYPES: LessonType[] = [
  'reading', 'video', 'quiz', 'checkpoint', 'lab', 'assignment',
  'simulation', 'practicum', 'externship', 'clinical', 'observation',
  'final_exam', 'capstone', 'certification',
];

// ─── Type groupings ───────────────────────────────────────────────────────────

/** Lesson types that require a passing score before the learner can advance. */
export const GATED_LESSON_TYPES: LessonType[] = [
  'quiz', 'checkpoint', 'final_exam',
];

/** Lesson types that require evidence submission from the learner. */
export const EVIDENCE_LESSON_TYPES: LessonType[] = [
  'lab', 'assignment', 'simulation', 'practicum', 'externship',
  'clinical', 'observation', 'capstone',
];

/** Lesson types that may require evaluator/instructor review. */
export const REVIEW_LESSON_TYPES: LessonType[] = [
  'lab', 'assignment', 'simulation', 'practicum', 'externship',
  'clinical', 'observation', 'capstone',
];

/** Lesson types that track hours/attempts (practical field training). */
export const PRACTICAL_LESSON_TYPES: LessonType[] = [
  'practicum', 'externship', 'clinical', 'observation',
];

/** Lesson types that require video_file + transcript + runtime for publish. */
export const VIDEO_LESSON_TYPES: LessonType[] = ['video'];

/** Lesson types that require quiz_questions + passing_score for publish. */
export const ASSESSMENT_LESSON_TYPES: LessonType[] = [
  'quiz', 'checkpoint', 'final_exam',
];

// ─── Display metadata ─────────────────────────────────────────────────────────

export type LessonTypeMeta = {
  label: string;
  shortLabel: string;
  color: string;       // Tailwind text color
  bgColor: string;     // Tailwind bg color
  borderColor: string; // Tailwind border color
  badge: string;       // sidebar badge character
  description: string;
};

export const LESSON_TYPE_META: Record<LessonType, LessonTypeMeta> = {
  reading: {
    label: 'Reading', shortLabel: 'Read',
    color: 'text-slate-700', bgColor: 'bg-slate-50', borderColor: 'border-slate-200',
    badge: '📖', description: 'Text and rich-content instructional lesson',
  },
  video: {
    label: 'Video', shortLabel: 'Video',
    color: 'text-brand-blue-700', bgColor: 'bg-brand-blue-50', borderColor: 'border-brand-blue-200',
    badge: '▶', description: 'Video module with transcript and completion threshold',
  },
  quiz: {
    label: 'Quiz', shortLabel: 'Quiz',
    color: 'text-indigo-700', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200',
    badge: '?', description: 'Knowledge check quiz with passing score',
  },
  checkpoint: {
    label: 'Checkpoint', shortLabel: 'Check',
    color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200',
    badge: '⬡', description: 'Module-boundary gate — must pass to unlock next module',
  },
  lab: {
    label: 'Lab', shortLabel: 'Lab',
    color: 'text-teal-700', bgColor: 'bg-teal-50', borderColor: 'border-teal-200',
    badge: '⚗', description: 'Hands-on lab with evidence submission and instructor review',
  },
  assignment: {
    label: 'Assignment', shortLabel: 'Assign',
    color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200',
    badge: '✏', description: 'Written or project assignment with evidence submission',
  },
  simulation: {
    label: 'Simulation', shortLabel: 'Sim',
    color: 'text-cyan-700', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200',
    badge: '⚙', description: 'Interactive scenario simulation with evidence capture',
  },
  practicum: {
    label: 'Practicum', shortLabel: 'Prac',
    color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200',
    badge: '🏥', description: 'Supervised practical with hours and attempts tracking',
  },
  externship: {
    label: 'Externship', shortLabel: 'Ext',
    color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200',
    badge: '🏢', description: 'Externship block with hour tracking and supervisor signoff',
  },
  clinical: {
    label: 'Clinical', shortLabel: 'Clin',
    color: 'text-rose-700', bgColor: 'bg-rose-50', borderColor: 'border-rose-200',
    badge: '🩺', description: 'Clinical shift with hour tracking and evaluator signoff',
  },
  observation: {
    label: 'Observation', shortLabel: 'Obs',
    color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200',
    badge: '👁', description: 'Observation log with evidence capture',
  },
  final_exam: {
    label: 'Final Exam', shortLabel: 'Exam',
    color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200',
    badge: '📝', description: 'Final exam — must pass to complete the course',
  },
  capstone: {
    label: 'Capstone', shortLabel: 'Cap',
    color: 'text-violet-700', bgColor: 'bg-violet-50', borderColor: 'border-violet-200',
    badge: '🎓', description: 'Capstone project with rubric and evaluator review',
  },
  certification: {
    label: 'Certification', shortLabel: 'Cert',
    color: 'text-brand-green-700', bgColor: 'bg-brand-green-50', borderColor: 'border-brand-green-200',
    badge: '🏆', description: 'Completion and certificate issuance screen',
  },
};

// ─── Legacy type mapping ──────────────────────────────────────────────────────
// Maps old step_type values to canonical LessonType.
// Used by the normalizer and renderer for backward compatibility.

export const LEGACY_TYPE_MAP: Record<string, LessonType> = {
  lesson:        'reading',
  exam:          'final_exam',
  // These map directly — kept for explicitness
  reading:       'reading',
  video:         'video',
  quiz:          'quiz',
  checkpoint:    'checkpoint',
  lab:           'lab',
  assignment:    'assignment',
  simulation:    'simulation',
  practicum:     'practicum',
  externship:    'externship',
  clinical:      'clinical',
  observation:   'observation',
  final_exam:    'final_exam',
  capstone:      'capstone',
  certification: 'certification',
};

/** Normalizes any legacy or canonical type string to a LessonType. Falls back to 'reading'. */
export function normalizeLessonType(raw: string | null | undefined): LessonType {
  if (!raw) return 'reading';
  return LEGACY_TYPE_MAP[raw] ?? 'reading';
}
