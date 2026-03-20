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

const SLUG_TO_CREDENTIAL: Record<string, string> = {
  // PRS
  'prs':                              'prs',
  'peer-recovery-specialist':         'prs',
  'peer-recovery-specialist-jri':     'prs',
  'peer-recovery-support-specialist': 'prs',

  // CRS
  'crs':                              'crs',
  'certified-recovery-specialist':    'crs',

  // Bookkeeping
  'bookkeeping':                      'bookkeeping-quickbooks',
  'bookkeeping-quickbooks':           'bookkeeping-quickbooks',
  'bookkeeping-and-quickbooks':       'bookkeeping-quickbooks',
};

export function getBlueprintForProgram(program: ProgramLike): CredentialBlueprint | null {
  // Prefer explicit credential_slug on the program row
  if (program.credential_slug) {
    return getBlueprintByCredentialSlug(program.credential_slug);
  }

  // Fall back to known program slug aliases
  if (program.slug) {
    const credentialSlug = SLUG_TO_CREDENTIAL[program.slug];
    if (credentialSlug) {
      return getBlueprintByCredentialSlug(credentialSlug);
    }
  }

  return null;
}
