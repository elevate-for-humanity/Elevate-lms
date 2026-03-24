/**
 * lib/curriculum/blueprints/_template.ts
 *
 * COPY THIS FILE to create a new program blueprint.
 * Rename it: lib/curriculum/blueprints/[program-slug].ts
 * Then register it in lib/curriculum/blueprints/index.ts
 *
 * ─── HOW THE ENGINE WORKS ────────────────────────────────────────────────────
 *
 * 1. You define the blueprint here (modules + lessons + videoConfig).
 * 2. Run the seeder — it writes courses → course_modules → course_lessons.
 * 3. Every lesson row gets:
 *      - lesson_type   (inferred from slug suffix — see SLUG CONVENTIONS below)
 *      - activities    (NHA-style activity menu — auto-set by step_type)
 *      - video_config  (locked video format from blueprint.videoConfig)
 * 4. The course landing page renders the module accordion automatically.
 * 5. The lesson page renders the activity tabs automatically.
 * 6. The video generator reads video_config and produces one video per lesson.
 *
 * NO per-program code is required. Define the blueprint → run the seeder → done.
 *
 * ─── SLUG CONVENTIONS ────────────────────────────────────────────────────────
 *
 * The generator infers lesson_type from the slug suffix:
 *
 *   [slug]-checkpoint  → lesson_type = 'checkpoint'  (gates next module, quiz required)
 *   [slug]-exam        → lesson_type = 'exam'         (final exam, high pass threshold)
 *   [slug]-lab         → lesson_type = 'lab'          (hands-on, instructor sign-off)
 *   [slug]-assignment  → lesson_type = 'assignment'   (written, instructor sign-off)
 *   [slug]-quiz        → lesson_type = 'quiz'         (standalone quiz, no gate)
 *   anything else      → lesson_type = 'lesson'       (standard lesson)
 *
 * ─── ACTIVITY MENU (auto-generated per lesson_type) ─────────────────────────
 *
 *   lesson:      Video · Reading · Flashcards · Practice
 *   checkpoint:  Video · Reading · Flashcards · Practice · Checkpoint Quiz (gated)
 *   lab:         Video · Reading · Hands-On Lab (instructor sign-off)
 *   quiz/exam:   Video · Flashcards · Practice · Quiz
 *
 * ─── VIDEO FORMAT (locked in videoConfig) ────────────────────────────────────
 *
 *   - GPT-4o writes a unique script per lesson (title + module context)
 *   - DALL-E 3 generates a unique background image per lesson
 *   - HeyGen renders the avatar video (avatar + voice from videoConfig)
 *   - ffmpeg adds the branding bar (topBarColor + title overlay)
 *   - Output: public/[programSlug]/videos/[lesson-slug].mp4
 *
 * ─── SEEDER COMMANDS ─────────────────────────────────────────────────────────
 *
 *   # Dry run — see what would be written
 *   pnpm tsx scripts/seed-course-from-blueprint.ts --blueprint [id] --program [programId] --dry-run
 *
 *   # Seed (safe re-run, skips existing lessons)
 *   pnpm tsx scripts/seed-course-from-blueprint.ts --blueprint [id] --program [programId]
 *
 *   # Full rebuild (wipes and re-seeds)
 *   pnpm tsx scripts/seed-course-from-blueprint.ts --blueprint [id] --program [programId] --mode replace
 *
 *   # List all registered blueprints
 *   pnpm tsx scripts/seed-course-from-blueprint.ts --list
 *
 * ─── VIDEO GENERATOR COMMANDS ────────────────────────────────────────────────
 *
 *   # Generate all videos for this program
 *   node scripts/generate-blueprint-videos.mjs --program [programSlug]
 *
 *   # Single module
 *   node scripts/generate-blueprint-videos.mjs --module [module-slug]
 *
 *   # Single lesson
 *   node scripts/generate-blueprint-videos.mjs --lesson [lesson-slug]
 *
 *   # Dry run
 *   node scripts/generate-blueprint-videos.mjs --program [programSlug] --dry-run
 */

import type { CredentialBlueprint, BlueprintVideoConfig } from './types';

// ─── Video format — copy and adjust per program ───────────────────────────────
// This locks the visual identity for every lesson video in this program.
// The video generator reads this — do not change after videos are produced.

const PROGRAM_VIDEO_CONFIG: BlueprintVideoConfig = {
  template:           'elevate-slide',
  instructorName:     'Marcus Johnson',           // Change per program
  instructorTitle:    'Lead Instructor',          // Change per program
  instructorImagePath: '/images/instructors/marcus-johnson.jpg',

  topBarColor:        '#f97316',   // Elevate orange — change for different programs
  accentColor:        '#3b82f6',   // Blue accent
  backgroundColor:    '#0f172a',   // Dark navy

  ttsVoice:           'onyx',      // OpenAI TTS voice
  ttsSpeed:           0.95,

  slideCount:         5,
  segments:           ['intro', 'concept', 'visual', 'application', 'wrapup'],

  generateDalleImage: true,
  dalleImageStyle:    'natural',

  width:              1920,
  height:             1080,
};

// ─── Blueprint ────────────────────────────────────────────────────────────────

export const PROGRAM_BLUEPRINT: CredentialBlueprint = {
  // ── Identity ──────────────────────────────────────────────────────────────
  id:             'program-state-v1',       // e.g. 'cna-indiana-v1', 'bookkeeping-v1'
  version:        '1.0.0',
  credentialSlug: 'program-credential',     // credential_exam_domains.credential_slug
  credentialTitle: 'Program Full Title',    // e.g. 'CNA Certification'
  credentialCode:  'PROG-001',              // Short code for display
  state:           'IN',                    // Two-letter state or 'federal'
  programSlug:     'program-slug',          // programs.slug in DB
  trackVariants:   ['standard'],
  status:          'draft',                 // Change to 'active' when ready

  // ── Generation rules ──────────────────────────────────────────────────────
  generationRules: {
    allowRemediation:        true,
    allowExpansionLessons:   false,
    maxTotalLessons:         60,
    requiresFinalExam:       true,
    requiresUniversalReview: false,
    generatorMode:           'fixed',       // 'fixed' = use lessons[] exactly
  },

  // ── Hard counts — validated at module load time ───────────────────────────
  // Update these to match your actual module and lesson counts below.
  expectedModuleCount: 3,   // UPDATE THIS
  expectedLessonCount: 12,  // UPDATE THIS (count all lessons[] entries)

  // ── Video format — locked ─────────────────────────────────────────────────
  videoConfig: PROGRAM_VIDEO_CONFIG,

  // ── Assessment rules ──────────────────────────────────────────────────────
  assessmentRules: [
    {
      assessmentType:   'module',
      scope:            'all',
      minQuestions:     5,
      maxQuestions:     10,
      passingThreshold: 0.70,
    },
    {
      assessmentType:   'final',
      scope:            'all',
      minQuestions:     25,
      maxQuestions:     50,
      passingThreshold: 0.75,
    },
  ],

  // ── Modules ───────────────────────────────────────────────────────────────
  // Rules:
  //   - slug is the PERMANENT identity. Never change after seeding.
  //   - lessons[].slug suffix determines lesson_type (see SLUG CONVENTIONS above).
  //   - Every module should end with a -checkpoint lesson.
  //   - orderIndex is 1-based.
  //   - lessons[].order is 1-based within the module.

  modules: [
    {
      slug:       'module-one',
      title:      'Module One Title',
      orderIndex: 1,
      domainKey:  'domain_key_one',
      minLessons: 3,
      maxLessons: 6,
      quizRequired:      true,
      practicalRequired: false,
      isCritical:        true,
      requiredLessonTypes: [
        { lessonType: 'lesson',     requiredCount: 2 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'competency_one', isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'competency_two', isCritical: false, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'Introduction to Topic',
        'Core Concept',
        'Practical Application',
        'Module 1 Checkpoint Quiz',
      ],
      lessons: [
        // lesson_type = 'lesson' (default)
        { slug: 'module-one-01', title: 'Introduction to Topic',   order: 1, domainKey: 'domain_key_one' },
        { slug: 'module-one-02', title: 'Core Concept',            order: 2, domainKey: 'domain_key_one' },
        { slug: 'module-one-03', title: 'Practical Application',   order: 3, domainKey: 'domain_key_one' },
        // lesson_type = 'checkpoint' (slug ends in -checkpoint)
        { slug: 'module-one-checkpoint', title: 'Module 1 Checkpoint Quiz', order: 4, domainKey: 'domain_key_one' },
      ],
    },

    {
      slug:       'module-two',
      title:      'Module Two Title',
      orderIndex: 2,
      domainKey:  'domain_key_two',
      minLessons: 3,
      maxLessons: 6,
      quizRequired:      true,
      practicalRequired: true,
      isCritical:        true,
      requiredLessonTypes: [
        { lessonType: 'lesson',     requiredCount: 2 },
        { lessonType: 'lab',        requiredCount: 1 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'competency_three', isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'Topic Overview',
        'Hands-On Lab',
        'Review',
        'Module 2 Checkpoint Quiz',
      ],
      lessons: [
        { slug: 'module-two-01',         title: 'Topic Overview',           order: 1, domainKey: 'domain_key_two' },
        // lesson_type = 'lab' (slug ends in -lab)
        { slug: 'module-two-lab',        title: 'Hands-On Lab',             order: 2, domainKey: 'domain_key_two' },
        { slug: 'module-two-02',         title: 'Review',                   order: 3, domainKey: 'domain_key_two' },
        { slug: 'module-two-checkpoint', title: 'Module 2 Checkpoint Quiz', order: 4, domainKey: 'domain_key_two' },
      ],
    },

    {
      slug:       'final-module',
      title:      'Final Assessment',
      orderIndex: 3,
      domainKey:  'domain_key_final',
      minLessons: 2,
      maxLessons: 4,
      quizRequired:      true,
      practicalRequired: false,
      isCritical:        true,
      requiredLessonTypes: [
        { lessonType: 'exam', requiredCount: 1 },
      ],
      competencies: [],
      suggestedLessonSkeleton: [
        'Final Review',
        'Program Final Exam',
      ],
      lessons: [
        { slug: 'final-review',      title: 'Final Review',       order: 1, domainKey: 'domain_key_final' },
        // lesson_type = 'exam' (slug ends in -exam)
        { slug: 'final-program-exam', title: 'Program Final Exam', order: 2, domainKey: 'domain_key_final' },
      ],
    },
  ],
};

// ─── Hard guard — catches miscounts at module load, not at runtime ────────────

const _moduleCount = PROGRAM_BLUEPRINT.modules.length;
if (_moduleCount !== PROGRAM_BLUEPRINT.expectedModuleCount) {
  throw new Error(
    `Blueprint invalid: expected ${PROGRAM_BLUEPRINT.expectedModuleCount} modules, got ${_moduleCount}`
  );
}

const _lessonCount = PROGRAM_BLUEPRINT.modules.reduce(
  (sum, m) => sum + (m.lessons?.length ?? 0), 0
);
if (_lessonCount !== PROGRAM_BLUEPRINT.expectedLessonCount) {
  throw new Error(
    `Blueprint invalid: expected ${PROGRAM_BLUEPRINT.expectedLessonCount} lessons, got ${_lessonCount}`
  );
}

export default PROGRAM_BLUEPRINT;
