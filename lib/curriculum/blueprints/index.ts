/**
 * lib/curriculum/blueprints/index.ts
 *
 * Registry of all credential blueprints.
 * Import from here — do not import individual blueprint files directly.
 */

export type { CredentialBlueprint, BlueprintModule, BlueprintLessonRef } from './types';
export { prsIndianaBlueprint } from './prs-indiana';
export { validateBlueprint } from './validateBlueprint';

import type { CredentialBlueprint } from './types';
import { prsIndianaBlueprint } from './prs-indiana';

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
