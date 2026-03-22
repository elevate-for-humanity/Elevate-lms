/**
 * getLegacyHvacContent
 *
 * Canonical access point for HVAC lesson content sourced from the legacy
 * static files (lib/courses/hvac-lesson-content.ts, hvac-quick-checks.ts,
 * hvac-quiz-map.ts, etc.).
 *
 * This file exists so the verifier script has a single tracked entry point
 * to confirm is present before the legacy_hvac renderer branch is removed.
 *
 * RETIREMENT: Delete this file in the same PR that removes case 'legacy_hvac'
 * from LessonContentRenderer.tsx. Do not delete before pnpm verify:hvac-legacy passes.
 *
 * Target: 2027-Q1
 */

export { HVAC_LESSON_CONTENT } from '@/lib/courses/hvac-lesson-content';
export { HVAC_QUICK_CHECKS } from '@/lib/courses/hvac-quick-checks';
export { HVAC_QUIZ_MAP } from '@/lib/courses/hvac-quiz-map';
