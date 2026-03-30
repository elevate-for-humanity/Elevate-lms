// Mirrors the DB schema from program_canonical_schema + program_outcomes + program_credentials

export type DeliveryMode = 'online' | 'hybrid' | 'in_person';
// Values must match program_lessons.lesson_type CHECK constraint
// checkpoint is a curriculum_lessons concept — not in program_lessons yet
export type LessonType = 'lesson' | 'quiz' | 'lab' | 'exam' | 'orientation' | 'checkpoint';
export type ProgramStatus = 'draft' | 'ready' | 'published' | 'archived';
export type CtaType = 'apply' | 'request_info' | 'external' | 'waitlist';
export type FundingType = 'funded' | 'self_pay' | 'partner' | 'employer_sponsored' | 'other';

export interface ProgramOutcome {
  id: string;
  text: string;
  outcome_order: number;
}

export interface ProgramCredential {
  id: string;
  credential_id: string;
  credential_name: string;
  credential_abbreviation: string | null;
  is_required: boolean;
  is_primary: boolean;
  sort_order: number;
}

export interface ProgramLesson {
  id: string;
  title: string;
  lesson_type: LessonType;
  sort_order: number;
  duration_minutes: number | null;
  is_published: boolean;
  has_video: boolean;
  has_reading: boolean;
}

export interface ProgramModule {
  id: string;
  title: string;
  sort_order: number;
  lessons: ProgramLesson[];
}

// Phases are a UI grouping layer — stored as modules with a phase_label
// We group modules by phase_label client-side
export interface ProgramPhase {
  id: string; // synthetic — phase label slug
  title: string;
  sort_order: number;
  modules: ProgramModule[];
}

export interface ProgramCta {
  id: string;
  cta_type: CtaType;
  label: string;
  href: string;
  style_variant: 'primary' | 'secondary' | 'ghost' | 'link';
  sort_order: number;
}

export interface ProgramTrack {
  id: string;
  track_code: string;
  title: string;
  funding_type: FundingType;
  cost_cents: number | null;
  available: boolean;
  sort_order: number;
}

export interface ProgramMedia {
  id: string;
  media_type: 'hero_image' | 'hero_video' | 'gallery_image' | 'thumbnail';
  url: string;
  alt_text: string | null;
}

export interface ProgramBuilderState {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  category: string;
  description: string;
  hero_image_url: string | null;

  outcomes: ProgramOutcome[];
  credentials: ProgramCredential[];
  phases: ProgramPhase[];
  ctas: ProgramCta[];
  tracks: ProgramTrack[];
  media: ProgramMedia[];

  estimated_weeks: number | null;
  estimated_hours: number | null;
  delivery_method: DeliveryMode | null;

  wioa_approved: boolean;
  dol_registered: boolean;
  etpl_listed: boolean;

  status: ProgramStatus;
  published: boolean;
}

// ── Derived operational state ─────────────────────────────────────────────────

export interface ProgramDerivedState {
  totalPhases: number;
  totalModules: number;
  totalLessons: number;
  emptyLessons: number;
  lessonsMissingVideo: number;
  lessonsMissingReading: number;
  completionPercent: number;
  missingRequired: string[];
  canPublish: boolean;
}

// ── Publish validator ─────────────────────────────────────────────────────────

export function validateProgram(state: ProgramBuilderState): ProgramDerivedState {
  const missing: string[] = [];

  if (!state.title?.trim()) missing.push('Program title');
  if (!state.description?.trim()) missing.push('Program description');
  if (!state.hero_image_url) missing.push('Hero image');
  if (state.outcomes.length < 3) missing.push(`Outcomes (${state.outcomes.length}/3 minimum)`);
  if (state.ctas.length === 0) missing.push('Primary CTA (apply / enroll link)');
  if (!state.estimated_weeks) missing.push('Program duration (weeks)');
  if (!state.delivery_method) missing.push('Delivery mode');

  const totalModules = state.phases.reduce((n, p) => n + p.modules.length, 0);
  const allLessons = state.phases.flatMap(p => p.modules.flatMap(m => m.lessons));
  const totalLessons = allLessons.length;
  const emptyLessons = allLessons.filter(l => !l.has_video && !l.has_reading).length;
  const lessonsMissingVideo = allLessons.filter(l => !l.has_video).length;
  const lessonsMissingReading = allLessons.filter(l => !l.has_reading).length;

  if (state.phases.length < 1) missing.push('At least 1 curriculum phase');
  if (totalModules < 3) missing.push(`Modules (${totalModules}/3 minimum)`);
  if (totalLessons < 10) missing.push(`Lessons (${totalLessons}/10 minimum)`);
  if (emptyLessons > 0) missing.push(`${emptyLessons} lesson${emptyLessons > 1 ? 's' : ''} with no content`);

  // Completion score: 8 required items
  const REQUIRED_ITEMS = 8;
  const completedItems = REQUIRED_ITEMS - Math.min(missing.length, REQUIRED_ITEMS);
  const completionPercent = Math.round((completedItems / REQUIRED_ITEMS) * 100);

  return {
    totalPhases: state.phases.length,
    totalModules,
    totalLessons,
    emptyLessons,
    lessonsMissingVideo,
    lessonsMissingReading,
    completionPercent,
    missingRequired: missing,
    canPublish: missing.length === 0,
  };
}
