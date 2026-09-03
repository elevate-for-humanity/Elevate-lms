/**
 * HVAC Legacy Retirement Kill Switch
 *
 * HVAC_LEGACY_RUNTIME_ALLOWED controls whether the legacy_hvac renderer branch
 * in LessonContentRenderer.tsx is permitted to execute at runtime.
 *
 * Flip to false when all prerequisites in docs/hvac-legacy-retirement-checklist.md
 * are confirmed. This produces an explicit runtime error instead of silently
 * serving stale legacy content after the cutover date.
 *
 * Target retirement window: 2027-Q1
 * Prerequisite script: pnpm verify:hvac-legacy
 */

export const HVAC_LEGACY_RETIREMENT_TARGET = '2027-Q1';

/**
 * Set to false to hard-disable the legacy_hvac renderer path.
 * The renderer will throw immediately, surfacing any missed cutover.
 * Do NOT set to false until `pnpm verify:hvac-legacy` passes clean.
 */
export const HVAC_LEGACY_RUNTIME_ALLOWED = true;
