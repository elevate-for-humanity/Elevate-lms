/**
 * lib/curriculum/builders/getBlueprintForProgram.ts
 *
 * Resolves the canonical CredentialBlueprint for a given program.
 * Prefers credential_slug over program slug.
 * Returns null if no blueprint is registered — callers must throw.
 *
 * Note: HVAC uses a generation-rules blueprint (HVAC_EPA608_BLUEPRINT) with a
 * different schema. It is not a CredentialBlueprint and is not returned here.
 * Use getHvacBlueprint() from blueprints/index.ts for HVAC generation.
 */

import type { CredentialBlueprint } from '../blueprints/types';
import { getBlueprintByCredentialSlug } from '../blueprints';

type ProgramLike = {
  slug?: string | null;
  credential_slug?: string | null;
};

const PRS_PROGRAM_SLUGS = new Set([
  'prs',
  'peer-recovery-specialist',
  'peer-recovery-specialist-jri',
  'peer-recovery-support-specialist',
]);

export function getBlueprintForProgram(program: ProgramLike): CredentialBlueprint | null {
  // Prefer explicit credential_slug
  if (program.credential_slug) {
    return getBlueprintByCredentialSlug(program.credential_slug);
  }

  // Fall back to known program slug aliases
  if (program.slug && PRS_PROGRAM_SLUGS.has(program.slug)) {
    return getBlueprintByCredentialSlug('prs');
  }

  return null;
}
