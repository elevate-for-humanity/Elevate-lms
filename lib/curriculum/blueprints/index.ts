/**
 * lib/curriculum/blueprints/index.ts
 *
 * Registry of all credential blueprints.
 * Import from here — do not import individual blueprint files directly.
 *
 * Two blueprint types exist:
 *
 * CredentialBlueprint — flat lesson-list blueprint consumed by CurriculumGenerator
 *   and the auditor. Fields: id, credentialSlug, credentialTitle, state,
 *   expectedModuleCount, expectedLessonCount, modules[].
 *   Current members: prsIndianaBlueprint.
 *
 * HVAC_EPA608_BLUEPRINT — generation-rules blueprint consumed by the AI course
 *   generator. Different schema (slug, programSlug, credentialCode, generationRules,
 *   competencies, assessments). Not a CredentialBlueprint — exported separately.
 *   Use getHvacBlueprint() to access it.
 */

export type { CredentialBlueprint, BlueprintModule, BlueprintLessonRef } from './types';
export { prsIndianaBlueprint } from './prs-indiana';
export { HVAC_EPA608_BLUEPRINT } from './hvac-epa-608';
export { validateBlueprint } from './validateBlueprint';

import type { CredentialBlueprint } from './types';
import { prsIndianaBlueprint } from './prs-indiana';
import { HVAC_EPA608_BLUEPRINT } from './hvac-epa-608';

// CredentialBlueprint registry — flat lesson-list blueprints only.
// HVAC_EPA608_BLUEPRINT is a generation-rules blueprint with a different schema
// and is not included here.
const REGISTRY: CredentialBlueprint[] = [
  prsIndianaBlueprint,
];

export function getBlueprintByCredentialSlug(credentialSlug: string): CredentialBlueprint | null {
  return REGISTRY.find(bp => bp.credentialSlug === credentialSlug) ?? null;
}

export function getBlueprintById(id: string): CredentialBlueprint | null {
  return REGISTRY.find(bp => bp.id === id) ?? null;
}

export function getAllBlueprints(): CredentialBlueprint[] {
  return [...REGISTRY];
}

/** Returns the HVAC generation-rules blueprint. Typed as unknown because it
 *  does not conform to CredentialBlueprint — callers must cast to their own type. */
export function getHvacBlueprint(): typeof HVAC_EPA608_BLUEPRINT {
  return HVAC_EPA608_BLUEPRINT;
}
