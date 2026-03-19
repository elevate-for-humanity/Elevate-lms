/**
 * lib/curriculum/blueprints/index.ts
 *
 * Registry of all credential blueprints.
 * Import from here — do not import individual blueprint files directly.
 *
 * All blueprints use the single CredentialBlueprint type from types.ts.
 * The generator, builder, auditor, and validator all consume that type.
 */

export type {
  CredentialBlueprint,
  BlueprintModule,
  BlueprintLessonRef,
  BlueprintCompetency,
  BlueprintLessonTypeRule,
  BlueprintAssessmentRule,
  BlueprintGenerationRules,
  BlueprintAuditResult,
  BlueprintAuditViolation,
} from './types';

export { prsIndianaBlueprint } from './prs-indiana';
export { HVAC_EPA608_BLUEPRINT } from './hvac-epa-608';
export { bookkeepingQuickbooksBlueprint } from './bookkeeping-quickbooks';
export { validateBlueprint } from './validateBlueprint';

import type { CredentialBlueprint } from './types';
import { prsIndianaBlueprint } from './prs-indiana';
import { HVAC_EPA608_BLUEPRINT } from './hvac-epa-608';
import { bookkeepingQuickbooksBlueprint } from './bookkeeping-quickbooks';

// ── Blueprint registry ────────────────────────────────────────────────────────
// All programs in a single registry. Add new blueprints here.

const REGISTRY: CredentialBlueprint[] = [
  prsIndianaBlueprint,
  HVAC_EPA608_BLUEPRINT,
  bookkeepingQuickbooksBlueprint,
];

export function getBlueprintByCredentialSlug(credentialSlug: string): CredentialBlueprint | null {
  return REGISTRY.find(bp => bp.credentialSlug === credentialSlug) ?? null;
}

export function getBlueprintById(id: string): CredentialBlueprint | null {
  return REGISTRY.find(bp => bp.id === id) ?? null;
}

export function getBlueprintByProgramSlug(programSlug: string): CredentialBlueprint | null {
  return REGISTRY.find(bp => bp.programSlug === programSlug) ?? null;
}

export function getAllBlueprints(): CredentialBlueprint[] {
  return [...REGISTRY];
}

/** @deprecated Use getBlueprintById('hvac-epa608-v1') instead */
export function getHvacBlueprint(): CredentialBlueprint {
  return HVAC_EPA608_BLUEPRINT;
}
