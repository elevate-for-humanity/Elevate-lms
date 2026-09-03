/**
 * lib/curriculum/activities.ts
 *
 * Canonical activity-menu generation for course lessons.
 *
 * Every lesson stored in course_lessons carries an `activities` JSONB column
 * that drives the NHA-style tab bar on the lesson page. This module is the
 * single source of truth for what activities are generated per step_type.
 *
 * Import this utility anywhere a lesson row is created or updated — never
 * define activity menus inline in route handlers or seed scripts.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivityType = 'video' | 'reading' | 'flashcards' | 'lab' | 'practice' | 'checkpoint';

export type ActivityDescriptor = {
  type: ActivityType;
  label: string;
  order: number;
  required: boolean;
};

// ─── Step-type → activity menu ────────────────────────────────────────────────
//
// This table drives the lesson page activity tabs.
//
// | step_type   | Activities                                              |
// |-------------|----------------------------------------------------------|
// | lesson      | Video · Reading · Flashcards · Practice                 |
// | checkpoint  | Video · Reading · Flashcards · Practice · Checkpoint    |
// | lab         | Video · Reading · Hands-On Lab                          |
// | assignment  | Video · Reading · Hands-On Lab  (same shell as lab)     |
// | quiz / exam | Video · Flashcards · Practice · Quiz                    |
// | (default)   | Video · Reading · Flashcards · Practice                 |

export function defaultActivities(stepType: string): ActivityDescriptor[] {
  switch (stepType) {
    case 'checkpoint':
      return [
        { type: 'video', label: 'Watch Lesson Video', order: 1, required: true },
        { type: 'reading', label: 'Reading', order: 2, required: true },
        { type: 'flashcards', label: 'Flashcards', order: 3, required: false },
        { type: 'practice', label: 'Practice Questions', order: 4, required: true },
        { type: 'checkpoint', label: 'Checkpoint Quiz', order: 5, required: true },
      ];

    case 'lab':
    case 'assignment':
      return [
        { type: 'video', label: 'Watch Lesson Video', order: 1, required: true },
        { type: 'reading', label: 'Reading', order: 2, required: true },
        { type: 'lab', label: 'Hands-On Lab', order: 3, required: true },
      ];

    case 'quiz':
    case 'exam':
      return [
        { type: 'video', label: 'Watch Lesson Video', order: 1, required: false },
        { type: 'flashcards', label: 'Flashcards', order: 2, required: false },
        { type: 'practice', label: 'Practice Questions', order: 3, required: false },
        { type: 'checkpoint', label: 'Quiz', order: 4, required: true },
      ];

    default: // 'lesson', 'certification', and anything unrecognised
      return [
        { type: 'video', label: 'Watch Lesson Video', order: 1, required: true },
        { type: 'reading', label: 'Reading', order: 2, required: true },
        { type: 'flashcards', label: 'Flashcards', order: 3, required: false },
        { type: 'practice', label: 'Practice Questions', order: 4, required: false },
      ];
  }
}

// ─── Lesson-type normaliser ───────────────────────────────────────────────────
//
// Some creation paths (course-builder admin UI, AI generator) use an extended
// lesson-type vocabulary. This function maps them to the canonical step_type
// values that `defaultActivities` understands.
//
// Extended types     → canonical step_type
// ─────────────────────────────────────────
// video / reading / live_session  → 'lesson'
// practical / fieldwork / observation → 'lab'
// All others carry through unchanged.

export function normaliseStepType(lessonType: string): string {
  switch (lessonType) {
    case 'video':
    case 'reading':
    case 'live_session':
      return 'lesson';
    case 'practical':
    case 'fieldwork':
    case 'observation':
      return 'lab';
    default:
      return lessonType; // 'checkpoint', 'exam', 'quiz', 'assignment', 'lab', 'lesson'
  }
}
