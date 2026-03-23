/**
 * resolveLegacyHvacSimulation
 *
 * Resolves the simulation key and simulation data for a given HVAC lesson UUID,
 * sourced from the legacy static map (lib/lms/hvac-simulations.ts).
 *
 * Once simulation keys are migrated to curriculum_lessons.content_structured
 * (prerequisite 4 in docs/hvac-legacy-retirement-checklist.md), this resolver
 * is dead code.
 *
 * RETIREMENT: Delete this file in the same PR that removes case 'legacy_hvac'
 * from LessonContentRenderer.tsx. Do not delete before pnpm verify:hvac-legacy passes.
 *
 * Target: 2027-Q1
 */

import {
  lessonUuidToSimulationKey,
  hvacLessonSimulations,
} from '@/lib/lms/hvac-simulations';

export type HvacSimulationKey = keyof typeof hvacLessonSimulations;

export interface ResolvedHvacSimulation {
  key: HvacSimulationKey;
  data: (typeof hvacLessonSimulations)[HvacSimulationKey];
}

/**
 * Returns the simulation key and data for a lesson UUID, or null if the lesson
 * has no associated simulation.
 */
export function resolveLegacyHvacSimulation(
  lessonId: string
): ResolvedHvacSimulation | null {
  const key = lessonUuidToSimulationKey[lessonId] as HvacSimulationKey | undefined;
  if (!key) return null;

  const data = hvacLessonSimulations[key];
  if (!data) return null;

  return { key, data };
}
